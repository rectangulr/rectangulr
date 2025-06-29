/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import { NodePath, PluginObj, PluginPass, types } from '@babel/core';
import annotateAsPure from '@babel/helper-annotate-as-pure';
import splitExportDeclaration from '@babel/helper-split-export-declaration';

/**
 * The name of the Typescript decorator helper function created by the TypeScript compiler.
 */
const TSLIB_DECORATE_HELPER_NAME = '__decorate';

/**
 * The set of Angular static fields that should always be wrapped.
 * These fields may appear to have side effects but are safe to remove if the associated class
 * is otherwise unused within the output.
 */
const angularStaticsToWrap = new Set([
  'ɵcmp',
  'ɵdir',
  'ɵfac',
  'ɵinj',
  'ɵmod',
  'ɵpipe',
  'ɵprov',
  'INJECTOR_KEY',
]);

/**
 * An object map of static fields and related value checks for discovery of Angular generated
 * JIT related static fields.
 */
const angularStaticsToElide: Record<string, (path: NodePath<types.Expression>) => boolean> = {
  'ctorParameters'(path) {
    return path.isFunctionExpression() || path.isArrowFunctionExpression();
  },
  'decorators'(path) {
    return path.isArrayExpression();
  },
  'propDecorators'(path) {
    return path.isObjectExpression();
  },
};

/**
 * Provides one or more keywords that if found within the content of a source file indicate
 * that this plugin should be used with a source file.
 *
 * @returns An a string iterable containing one or more keywords.
 */
export function getKeywords(): Iterable<string> {
  return ['class'];
}

/**
 * Determines whether a property and its initializer value can be safely wrapped in a pure
 * annotated IIFE. Values that may cause side effects are not considered safe to wrap.
 * Wrapping such values may cause runtime errors and/or incorrect runtime behavior.
 *
 * @param propertyName The name of the property to analyze.
 * @param assignmentValue The initializer value that will be assigned to the property.
 * @returns If the property can be safely wrapped, then true; otherwise, false.
 */
function canWrapProperty(propertyName: string, assignmentValue: NodePath): boolean {
  if (angularStaticsToWrap.has(propertyName)) {
    return true;
  }

  const { leadingComments } = assignmentValue.node as { leadingComments?: { value: string }[] };
  if (
    leadingComments?.some(
      // `@pureOrBreakMyCode` is used by closure and is present in Angular code
      ({ value }) =>
        value.includes('@__PURE__') ||
        value.includes('#__PURE__') ||
        value.includes('@pureOrBreakMyCode'),
    )
  ) {
    return true;
  }

  return assignmentValue.isPure();
}

/**
 * Analyze the sibling nodes of a class to determine if any downlevel elements should be
 * wrapped in a pure annotated IIFE. Also determines if any elements have potential side
 * effects.
 *
 * @param origin The starting NodePath location for analyzing siblings.
 * @param classIdentifier The identifier node that represents the name of the class.
 * @param allowWrappingDecorators Whether to allow decorators to be wrapped.
 * @returns An object containing the results of the analysis.
 */
function analyzeClassSiblings(
  origin: NodePath,
  classIdentifier: types.Identifier,
  allowWrappingDecorators: boolean,
): { hasPotentialSideEffects: boolean; wrapStatementPaths: NodePath<types.Statement>[] } {
  const wrapStatementPaths: NodePath<types.Statement>[] = [];
  let hasPotentialSideEffects = false;
  for (let i = 1; ; ++i) {
    const nextStatement = origin.getSibling(+(origin.key ?? 0) + i);
    if (!nextStatement.isExpressionStatement()) {
      break;
    }

    // Valid sibling statements for class declarations are only assignment expressions
    // and TypeScript decorator helper call expressions
    const nextExpression = nextStatement.get('expression');
    if (nextExpression.isCallExpression()) {
      if (
        !types.isIdentifier(nextExpression.node.callee) ||
        nextExpression.node.callee.name !== TSLIB_DECORATE_HELPER_NAME
      ) {
        break;
      }

      if (allowWrappingDecorators) {
        wrapStatementPaths.push(nextStatement);
      } else {
        // Statement cannot be safely wrapped which makes wrapping the class unneeded.
        // The statement will prevent even a wrapped class from being optimized away.
        hasPotentialSideEffects = true;
      }

      continue;
    } else if (!nextExpression.isAssignmentExpression()) {
      break;
    }

    // Valid assignment expressions should be member access expressions using the class
    // name as the object and an identifier as the property for static fields or only
    // the class name for decorators.
    const left = nextExpression.get('left');
    if (left.isIdentifier()) {
      if (
        !left.scope.bindingIdentifierEquals(left.node.name, classIdentifier) ||
        !types.isCallExpression(nextExpression.node.right) ||
        !types.isIdentifier(nextExpression.node.right.callee) ||
        nextExpression.node.right.callee.name !== TSLIB_DECORATE_HELPER_NAME
      ) {
        break;
      }

      if (allowWrappingDecorators) {
        wrapStatementPaths.push(nextStatement);
      } else {
        // Statement cannot be safely wrapped which makes wrapping the class unneeded.
        // The statement will prevent even a wrapped class from being optimized away.
        hasPotentialSideEffects = true;
      }

      continue;
    } else if (
      !left.isMemberExpression() ||
      !types.isIdentifier(left.node.object) ||
      !left.scope.bindingIdentifierEquals(left.node.object.name, classIdentifier) ||
      !types.isIdentifier(left.node.property)
    ) {
      break;
    }

    const propertyName = left.node.property.name;
    const assignmentValue = nextExpression.get('right');
    if (angularStaticsToElide[propertyName]?.(assignmentValue)) {
      nextStatement.remove();
      --i;
    } else if (canWrapProperty(propertyName, assignmentValue)) {
      wrapStatementPaths.push(nextStatement);
    } else {
      // Statement cannot be safely wrapped which makes wrapping the class unneeded.
      // The statement will prevent even a wrapped class from being optimized away.
      hasPotentialSideEffects = true;
    }
  }

  return { hasPotentialSideEffects, wrapStatementPaths };
}

/**
 * The set of classes already visited and analyzed during the plugin's execution.
 * This is used to prevent adjusted classes from being repeatedly analyzed which can lead
 * to an infinite loop.
 */
const visitedClasses = new WeakSet<types.Class>();

/**
 * A map of classes that have already been analyzed during the default export splitting step.
 * This is used to avoid analyzing a class declaration twice if it is a direct default export.
 */
const exportDefaultAnalysis = new WeakMap<types.Class, ReturnType<typeof analyzeClassSiblings>>();

/**
 * A babel plugin factory function for adjusting classes; primarily with Angular metadata.
 * The adjustments include wrapping classes with known safe or no side effects with pure
 * annotations to support dead code removal of unused classes. Angular compiler generated
 * metadata static fields not required in AOT mode are also elided to better support bundler-
 * level treeshaking.
 *
 * @returns A babel plugin object instance.
 */
// eslint-disable-next-line max-lines-per-function
export default function (): PluginObj {
  return {
    visitor: {
      // When a class is converted to a variable declaration, the default export must be moved
      // to a subsequent statement to prevent a JavaScript syntax error.
      ExportDefaultDeclaration(path: NodePath<types.ExportDefaultDeclaration>, state: PluginPass) {
        const declaration = path.get('declaration');
        if (!declaration.isClassDeclaration() || !declaration.node.id) {
          return;
        }

        const { wrapDecorators } = state.opts as { wrapDecorators: boolean };
        const analysis = analyzeClassSiblings(path, declaration.node.id, wrapDecorators);
        exportDefaultAnalysis.set(declaration.node, analysis);

        // Splitting the export declaration is not needed if the class will not be wrapped
        if (analysis.hasPotentialSideEffects) {
          return;
        }

        splitExportDeclaration(path);
      },
      ClassDeclaration(path: NodePath<types.ClassDeclaration>, state: PluginPass) {
        const { node: classNode, parentPath } = path;
        const { wrapDecorators } = state.opts as { wrapDecorators: boolean };

        // Skip if already visited or has no name
        if (visitedClasses.has(classNode) || !classNode.id) {
          return;
        }

        // Analyze sibling statements for elements of the class that were downleveled
        const origin = parentPath.isExportNamedDeclaration() ? parentPath : path;
        const { wrapStatementPaths, hasPotentialSideEffects } =
          exportDefaultAnalysis.get(classNode) ??
          analyzeClassSiblings(origin, classNode.id, wrapDecorators);

        visitedClasses.add(classNode);

        // If no statements to wrap, check for static class properties.
        if (
          hasPotentialSideEffects ||
          (wrapStatementPaths.length === 0 && !analyzeClassStaticProperties(path).shouldWrap)
        ) {
          return;
        }

        const wrapStatementNodes: types.Statement[] = [];
        for (const statementPath of wrapStatementPaths) {
          wrapStatementNodes.push(statementPath.node);
          statementPath.remove();
        }

        // Wrap class and safe static assignments in a pure annotated IIFE
        const container = types.arrowFunctionExpression(
          [],
          types.blockStatement([
            classNode,
            ...wrapStatementNodes,
            types.returnStatement(types.cloneNode(classNode.id)),
          ]),
        );
        const replacementInitializer = types.callExpression(
          types.parenthesizedExpression(container),
          [],
        );
        annotateAsPure(replacementInitializer);

        // Replace class with IIFE wrapped class
        const declaration = types.variableDeclaration('let', [
          types.variableDeclarator(types.cloneNode(classNode.id), replacementInitializer),
        ]);
        path.replaceWith(declaration);
      },
      ClassExpression(path: NodePath<types.ClassExpression>, state: PluginPass) {
        const { node: classNode, parentPath } = path;
        const { wrapDecorators } = state.opts as { wrapDecorators: boolean };

        if (visitedClasses.has(classNode)) {
          return;
        }

        if (!parentPath.isVariableDeclarator() || !types.isIdentifier(parentPath.node.id)) {
          return;
        }

        const origin = parentPath.parentPath;
        if (!origin.isVariableDeclaration() || origin.node.declarations.length !== 1) {
          return;
        }

        const { wrapStatementPaths, hasPotentialSideEffects } = analyzeClassSiblings(
          origin,
          parentPath.node.id,
          wrapDecorators,
        );

        visitedClasses.add(classNode);

        // If no statements to wrap, check for static class properties.
        if (
          hasPotentialSideEffects ||
          (wrapStatementPaths.length === 0 && !analyzeClassStaticProperties(path).shouldWrap)
        ) {
          return;
        }

        const wrapStatementNodes: types.Statement[] = [];
        for (const statementPath of wrapStatementPaths) {
          wrapStatementNodes.push(statementPath.node);
          statementPath.remove();
        }

        // Wrap class and safe static assignments in a pure annotated IIFE
        const container = types.arrowFunctionExpression(
          [],
          types.blockStatement([
            types.variableDeclaration('let', [
              types.variableDeclarator(types.cloneNode(parentPath.node.id), classNode),
            ]),
            ...wrapStatementNodes,
            types.returnStatement(types.cloneNode(parentPath.node.id)),
          ]),
        );
        const replacementInitializer = types.callExpression(
          types.parenthesizedExpression(container),
          [],
        );

        annotateAsPure(replacementInitializer);

        // Add the wrapped class directly to the variable declaration
        parentPath.get('init').replaceWith(replacementInitializer);
      },
    },
  };
}

/**
 * Static class properties may be downleveled at later stages in the build pipeline
 * which results in additional function calls outside the class body. These calls
 * then cause the class to be referenced and not eligible for removal. Since it is
 * not known at this stage whether the class needs to be downleveled, the transform
 * wraps classes preemptively to allow for potential removal within the optimization stages.
 */
function analyzeClassStaticProperties(
  path: NodePath<types.ClassDeclaration | types.ClassExpression>,
): { shouldWrap: boolean } {
  let shouldWrap = false;
  for (const element of path.get('body').get('body')) {
    if (element.isClassProperty()) {
      // Only need to analyze static properties
      if (!element.node.static) {
        continue;
      }

      // Check for potential side effects.
      // These checks are conservative and could potentially be expanded in the future.
      const elementKey = element.get('key');
      const elementValue = element.get('value');
      if (
        elementKey.isIdentifier() &&
        (!elementValue.isExpression() || canWrapProperty(elementKey.node.name, elementValue))
      ) {
        shouldWrap = true;
      } else {
        // Not safe to wrap
        shouldWrap = false;
        break;
      }
    } else if (element.isStaticBlock()) {
      // Only need to analyze static blocks
      const body = element.get('body');

      if (Array.isArray(body) && body.length > 1) {
        // Not safe to wrap
        shouldWrap = false;
        break;
      }

      const expression = body.find((n) => n.isExpressionStatement());

      const assignmentExpression = expression?.get('expression');
      if (assignmentExpression?.isAssignmentExpression()) {
        const left = assignmentExpression.get('left');
        if (!left.isMemberExpression()) {
          continue;
        }

        if (!left.get('object').isThisExpression()) {
          // Not safe to wrap
          shouldWrap = false;
          break;
        }

        const element = left.get('property');
        const right = assignmentExpression.get('right');
        if (
          element.isIdentifier() &&
          (!right.isExpression() || canWrapProperty(element.node.name, right))
        ) {
          shouldWrap = true;
        } else {
          // Not safe to wrap
          shouldWrap = false;
          break;
        }
      }
    }
  }

  return { shouldWrap };
}
