import { Component, ElementRef, NO_ERRORS_SCHEMA, ViewChild } from '@angular/core'
import * as Yoga from 'typeflex'
import { H } from '../../components/1-basics/h'
import { V } from '../../components/1-basics/v'
import { GrowDirective } from '../../components/1-basics/grow.directive'
import { StyleDirective } from '../../components/1-basics/style'
import { setupTest } from '../../tests/utils'
import { Element } from './sources'

describe('DOM - ', () => {
  it('child should be bigger than parent', () => {
    @Component({
    template: `
        <v #parent [s]="{ width: 5 }">
          <h #child [s]="{ flexShrink: 0, alignSelf: 'flexStart' }">aaaaaaaaaa</h>
        </v>
      `,
    imports: [H, V, GrowDirective, StyleDirective]
})
    class Test {
      @ViewChild('parent') parent: ElementRef<Element>
      @ViewChild('child') child: ElementRef<Element>
    }

    const { fixture, component, shortcuts } = setupTest(Test)
    const parent = component.parent.nativeElement
    const child = component.child.nativeElement
    const text = child.yogaNode.getChild(0)

    parent.rootNode.triggerUpdates()
    // console.log(debugYoga(parent.yogaNode))
    expect(parent.yogaNode.getComputedWidth()).toEqual(5)
    expect(child.yogaNode.getComputedLayout().width).toEqual(10)
  })

  it('text should stretch the parent', async () => {
    @Component({
    imports: [GrowDirective, V, H],
    template: ` <h #parent>aaaaaaaaaa</h> `
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
    imports: [H, V, GrowDirective, StyleDirective],
    template: `
        <v #parent [s]="{ width: 20 }">
          <h #child1>Test</h>
          <h #child2>Test2</h>
        </v>
      `
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

    expect(parent.style.get('width')).toEqual(20)
    expect(parent.yogaNode.getAlignItems()).toEqual(1)

    expect(child1.yogaNode.getComputedLayout().top).toEqual(0)
    expect(child2.yogaNode.getComputedLayout().top).toEqual(1)

    expect(child1.yogaNode.getComputedLayout().width).toEqual(4)
    expect(child2.yogaNode.getComputedLayout().width).toEqual(5)
  })

  it('v hgrow', async () => {
    @Component({
    imports: [H, V, GrowDirective, StyleDirective],
    template: `
        <v #parent [s]="{ width: 20 }">
          <h #child1 [s]="{ hgrow: true }">Test</h>
          <h #child2 [s]="{ hgrow: true }">Test2</h>
        </v>
      `
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

    parent.rootNode.triggerUpdates()
    expect(parent.yogaNode.getComputedLayout().width).toEqual(20)

    expect(child1.yogaNode.getComputedLayout().top).toEqual(0)
    expect(child2.yogaNode.getComputedLayout().top).toEqual(1)

    expect(child1.yogaNode.getComputedLayout().width).toEqual(20)
    expect(child2.yogaNode.getComputedLayout().width).toEqual(20)
  })

  it('hbox vgrow', async () => {
    @Component({
    imports: [H, V, StyleDirective],
    template: `
        <h #parent [s]="{ height: 20 }">
          <h #child1 [s]="{ vgrow: true }">Test</h>
          <h #child2 [s]="{ vgrow: true }">Test2</h>
        </h>
      `
})
    class Test {
      @ViewChild('parent') parent: ElementRef<Element>
      @ViewChild('child1') child1: ElementRef<Element>
      @ViewChild('child2') child2: ElementRef<Element>
    }
    const { fixture, component, shortcuts } = setupTest(Test)

    const parent = component.parent.nativeElement
    parent.rootNode.triggerUpdates()
    expect(parent.yogaNode.getComputedLayout().height).toEqual(20)
    expect(parent.yogaNode.getAlignItems()).toEqual(Yoga.ALIGN_FLEX_START)
    expect(parent.yogaNode.getAlignContent()).toEqual(Yoga.ALIGN_FLEX_START)
    expect(parent.yogaNode.getFlexDirection()).toEqual(Yoga.FLEX_DIRECTION_ROW)

    const child1 = component.child1.nativeElement
    expect(child1.yogaNode.getComputedLayout().left).toEqual(0)
    expect(child1.yogaNode.getComputedLayout().height).toEqual(20)
    expect(child1.yogaNode.getAlignSelf()).toEqual(Yoga.ALIGN_STRETCH)

    const child2 = component.child2.nativeElement
    expect(child2.yogaNode.getComputedLayout().left).toEqual(4)
    expect(child2.yogaNode.getComputedLayout().height).toEqual(20)
    expect(child1.yogaNode.getAlignSelf()).toEqual(Yoga.ALIGN_STRETCH)
  })

  it('h grow', async () => {
    @Component({
    imports: [H, V, StyleDirective, GrowDirective],
    template: `
        <h #parent [s]="{ height: 20, width: 20 }">
          <h grow #child1></h>
        </h>
      `
})
    class Test {
      @ViewChild('parent') parent: ElementRef<Element>
      @ViewChild('child1') child1: ElementRef<Element>
    }
    const { fixture, component, shortcuts } = setupTest(Test)

    const child1 = component.child1.nativeElement
    expect(child1.yogaNode.getComputedLayout().width).toEqual(20)
    expect(child1.yogaNode.getComputedLayout().height).toEqual(20)
  })

})
