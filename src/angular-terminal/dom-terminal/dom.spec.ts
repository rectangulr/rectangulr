import { Component, ElementRef, ViewChild } from '@angular/core'
import * as Yoga from 'typeflex'
import { GrowDirective, HBox, VBox } from '../../components/1-basics/box'
import { StyleDirective } from '../../components/1-basics/style'
import { setupTest } from '../../utils/tests'
import { Element } from './sources'

function diff(a, b) {
  if (typeof a == 'object') {
    const res = {}
    Object.entries(a).forEach(([key, value]) => {
      const difference = diff(a[key], b[key])
      if (difference !== undefined) {
        res[key] = difference
      }
    })
    if (Object.keys(res).length == 0) return undefined
    return res
  } else {
    if (a != b) {
      return b
    }
  }
}

function debugYoga(node: any, cleanNode = Yoga.Node.create().node) {

  if ('node' in node) return debugYoga(node.node, cleanNode)

  const res = { id: node.id } as any
  if (node.children_.length > 0) {
    res.children = node.children_.map(child => debugYoga(child, cleanNode))
  }
  res.style = diff(cleanNode.style_, node.style_)
  return res
}

globalThis['debugYoga'] = debugYoga

describe('DOM - ', () => {
  it('child should be bigger than parent', () => {
    @Component({
      template: `
        <v #parent [s]="{ width: 5 }">
          <h #child [s]="{ flexShrink: 0, alignSelf: 'flexStart' }">aaaaaaaaaa</h>
        </v>
      `,
      standalone: true,
      imports: [HBox, VBox, GrowDirective, StyleDirective],
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<Element>
      @ViewChild('child') child: ElementRef<Element>
    }

    const { fixture, component, shortcuts } = setupTest(Test)
    const parent = component.parent.nativeElement
    const child = component.child.nativeElement
    const text = child.yogaNode.getChild(0)

    // console.log(debugYoga(parent.yogaNode))
    expect(parent.yogaNode.getComputedWidth()).toEqual(5)
    expect(child.yogaNode.getComputedLayout().width).toEqual(10)
  })

  it('text should stretch the parent', async () => {
    @Component({
      standalone: true,
      imports: [GrowDirective, VBox, HBox],
      template: ` <h #parent>aaaaaaaaaa</h> `,
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<Element>
    }

    const { fixture, component, shortcuts } = setupTest(Test)
    const parent = component.parent.nativeElement
    const text = parent.childNodes[0]

    expect(parent.yogaNode.getComputedWidth()).toEqual(10)
  })

  it('<v>', async () => {
    @Component({
      standalone: true,
      imports: [HBox, VBox, GrowDirective, StyleDirective],
      template: `
        <v #parent [s]="{ width: 20 }">
          <h #child1>Test</h>
          <h #child2>Test2</h>
        </v>
      `,
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<Element>
      @ViewChild('child1') child1: ElementRef<Element>
      @ViewChild('child2') child2: ElementRef<Element>
    }

    const { fixture, component, shortcuts } = setupTest(Test)
    const parent = component.parent.nativeElement
    const child1 = component.child1.nativeElement
    const child2 = component.child2.nativeElement

    expect(parent.yogaNode.getAlignItems()).toEqual(1)

    expect(child1.yogaNode.getComputedLayout().top).toEqual(0)
    expect(child2.yogaNode.getComputedLayout().top).toEqual(1)

    expect(child1.yogaNode.getComputedLayout().width).toEqual(4)
    expect(child2.yogaNode.getComputedLayout().width).toEqual(5)
  })

  it('v hgrow', async () => {
    @Component({
      standalone: true,
      imports: [HBox, VBox, GrowDirective, StyleDirective],
      template: `
        <v #parent [s]="{ width: 20 }">
          <h #child1 [s]="{ hgrow: true }">Test</h>
          <h #child2 [s]="{ hgrow: true }">Test2</h>
        </v>
      `,
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<Element>
      @ViewChild('child1') child1: ElementRef<Element>
      @ViewChild('child2') child2: ElementRef<Element>
    }

    const { fixture, component, shortcuts } = setupTest(Test)
    const parent = component.parent.nativeElement
    const child1 = component.child1.nativeElement
    const child2 = component.child2.nativeElement


    expect(parent.yogaNode.getComputedLayout().width).toEqual(20)

    expect(child1.yogaNode.getComputedLayout().top).toEqual(0)
    expect(child2.yogaNode.getComputedLayout().top).toEqual(1)

    expect(child1.yogaNode.getComputedLayout().width).toEqual(20)
    expect(child2.yogaNode.getComputedLayout().width).toEqual(20)
  })

  it('hbox vgrow', async () => {
    @Component({
      standalone: true,
      imports: [HBox, VBox, StyleDirective],
      template: `
        <h #parent [s]="{ height: 20 }">
          <h #child1 [s]="{ vgrow: true }">Test</h>
          <h #child2 [s]="{ vgrow: true }">Test2</h>
        </h>
      `,
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<Element>
      @ViewChild('child1') child1: ElementRef<Element>
      @ViewChild('child2') child2: ElementRef<Element>
    }
    const { fixture, component, shortcuts } = setupTest(Test)

    const parent = component.parent.nativeElement
    expect(parent.yogaNode.getComputedLayout().height).toEqual(20)
    // expect(parent.yogaNode.getAlignItems()).toEqual(Yoga.ALIGN_FLEX_START)
    // expect(parent.yogaNode.getAlignContent()).toEqual(Yoga.ALIGN_FLEX_START)
    // expect(parent.yogaNode.getFlexDirection()).toEqual(Yoga.FLEX_DIRECTION_ROW)

    const child1 = component.child1.nativeElement
    expect(child1.yogaNode.getComputedLayout().left).toEqual(0)
    expect(child1.yogaNode.getComputedLayout().height).toEqual(20)
    // expect(child1.yogaNode.getAlignSelf()).toEqual(Yoga.ALIGN_STRETCH)

    const child2 = component.child2.nativeElement
    expect(child2.yogaNode.getComputedLayout().left).toEqual(4)
    expect(child2.yogaNode.getComputedLayout().height).toEqual(20)
    // expect(child1.yogaNode.getAlignSelf()).toEqual(Yoga.ALIGN_STRETCH)
  })

  it('hbox grow', async () => {
    @Component({
      standalone: true,
      imports: [HBox, VBox, StyleDirective, GrowDirective],
      template: `
        <h #parent [s]="{ height: 20, width: 20 }">
          <h grow #child1></h>
        </h>
      `,
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<Element>
      @ViewChild('child1') child1: ElementRef<Element>
    }
    const { fixture, component, shortcuts } = setupTest(Test)

    // const parent = component.parent.nativeElement
    // expect(parent.yogaNode.getComputedLayout().width).toEqual(20)
    // expect(parent.yogaNode.getComputedLayout().height).toEqual(20)

    const child1 = component.child1.nativeElement
    expect(child1.yogaNode.getComputedLayout().width).toEqual(20)
    expect(child1.yogaNode.getComputedLayout().height).toEqual(20)
  })
})
