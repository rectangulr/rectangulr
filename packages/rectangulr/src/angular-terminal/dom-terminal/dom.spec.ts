import { Component, ElementRef, ViewChild } from '@angular/core'
import * as Yoga from 'typeflex'
import { Grow } from '../../components/1-basics/grow.directive'
import { H } from '../../components/1-basics/h'
import { Style } from '../../components/1-basics/Style.directive'
import { V } from '../../components/1-basics/v'
import { setupTest } from '../../tests/utils'
import { TermElement } from './sources'

describe('DOM - ', () => {
  it('child should be bigger than parent', () => {
    @Component({
      template: `
        <v #parent [s]="{ width: 5 }">
          <h #child [s]="{ flexShrink: 0, alignSelf: 'flexStart' }">aaaaaaaaaa</h>
        </v>
      `,
      imports: [H, V, Grow, Style]
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<TermElement>
      @ViewChild('child') child: ElementRef<TermElement>
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
      imports: [Grow, V, H],
      template: ` <h #parent>aaaaaaaaaa</h> `
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<TermElement>
    }

    const { fixture, component, shortcuts } = setupTest(Test)
    const parent = component.parent.nativeElement
    const text = parent.childNodes[0]

    expect(parent.yogaNode.getComputedWidth()).toEqual(10)
  })

  it('<v>', async () => {
    @Component({
      imports: [H, V, Grow, Style],
      template: `
        <v #parent [s]="{ width: 20 }">
          <h #child1>Test</h>
          <h #child2>Test2</h>
        </v>
      `
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<TermElement>
      @ViewChild('child1') child1: ElementRef<TermElement>
      @ViewChild('child2') child2: ElementRef<TermElement>
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
      imports: [H, V, Grow, Style],
      template: `
        <v #parent [s]="{ width: 20 }">
          <h #child1 [s]="{ hgrow: true }">Test</h>
          <h #child2 [s]="{ hgrow: true }">Test2</h>
        </v>
      `
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<TermElement>
      @ViewChild('child1') child1: ElementRef<TermElement>
      @ViewChild('child2') child2: ElementRef<TermElement>
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
      imports: [H, V, Style],
      template: `
        <h #parent [s]="{ height: 20 }">
          <h #child1 [s]="{ vgrow: true }">Test</h>
          <h #child2 [s]="{ vgrow: true }">Test2</h>
        </h>
      `
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<TermElement>
      @ViewChild('child1') child1: ElementRef<TermElement>
      @ViewChild('child2') child2: ElementRef<TermElement>
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
      imports: [H, V, Style, Grow],
      template: `
        <h #parent [s]="{ height: 20, width: 20 }">
          <h grow #child1></h>
        </h>
      `
    })
    class Test {
      @ViewChild('parent') parent: ElementRef<TermElement>
      @ViewChild('child1') child1: ElementRef<TermElement>
    }
    const { fixture, component, shortcuts } = setupTest(Test)

    const child1 = component.child1.nativeElement
    expect(child1.yogaNode.getComputedLayout().width).toEqual(20)
    expect(child1.yogaNode.getComputedLayout().height).toEqual(20)
  })

})
