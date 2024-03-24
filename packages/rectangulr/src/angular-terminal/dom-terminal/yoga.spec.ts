import * as Yoga from 'typeflex'
import * as TYoga from './yoga-types/index'

function insert(child, parent) {
  parent.insertChild(child, 0)
}

describe('Yoga Layout - ', () => {
  it('the bug', async () => {
    const parent3 = Yoga.Node.create() as TYoga.Node // 5
    parent3.setWidth(5)

    const child5 = Yoga.Node.create() as TYoga.Node // 10
    insert(child5, parent3)
    child5.setFlexShrink(0)
    child5.setAlignSelf(Yoga.ALIGN_FLEX_START)
    // child5.setFlexGrow(1)

    const child7 = Yoga.Node.create() as TYoga.Node // 10
    insert(child7, child5)
    // child7.setAlignSelf(1)
    child7.setFlexDirection(2)
    child7.setMinHeight(1)
    child7.setFlexShrink(0)
    child7.setWidth(10)
    // child7.setMeasureFunc((maxWidth, widthMode, maxHeight, heightMode) => {
    //   return { width: 10, height: 1 }
    // })

    parent3.calculateLayout()
    expect(parent3.getComputedLayout().width).withContext('parent3').toEqual(5)
    expect(child5.getComputedLayout().width).withContext('child5').toEqual(10)
    expect(child7.getComputedLayout().width).withContext('child7').toEqual(10)
  })

  it('child setMeasureFunc', async () => {
    const parent = Yoga.Node.create()
    parent.setWidth(5)

    const child = Yoga.Node.create()
    parent.insertChild(child, 0)
    child.setAlignSelf(Yoga.ALIGN_FLEX_START)
    child.setMeasureFunc((maxWidth, widthMode, maxHeight, heightMode) => {
      return { width: 10, height: 1 }
    })

    parent.calculateLayout()
    const parentLayout = parent.getComputedLayout()
    const childLayout = child.getComputedLayout()

    expect(parentLayout.width).toEqual(5)
    expect(childLayout.width).toEqual(10)
  })

  it('child hgrow', async () => {
    const parent = Yoga.Node.create()
    parent.setAlignItems(Yoga.ALIGN_FLEX_START)
    parent.setAlignContent(Yoga.ALIGN_FLEX_START)
    parent.setWidth(10)

    const child = Yoga.Node.create()
    parent.insertChild(child, 0)
    child.setAlignSelf(Yoga.ALIGN_STRETCH)
    child.setMeasureFunc((maxWidth, widthMode, maxHeight, heightMode) => {
      return { width: 5, height: 1 }
    })

    parent.calculateLayout()
    const parentLayout = parent.getComputedLayout()
    const childLayout = child.getComputedLayout()

    expect(parentLayout.width).toEqual(10)
    expect(childLayout.width).toEqual(10)
  })
})

export function debugYoga(node: Yoga.Node) {
  const res: any = {
    computed: node.getComputedLayout(),
    asked: {
      width: node.getWidth(),
      height: node.getHeight(),
    },
    grow: {
      shrink: node.getFlexShrink(),
      grow: node.getFlexGrow(),
      alignSelf: node.getAlignSelf(),
      alignItems: node.getAlignItems(),
    },
  }

  let children = []
  for (let i = 0; i < node.getChildCount(); i++) {
    children.push(debugYoga(node.getChild(i)))
  }

  if (children.length > 0) {
    res.children = children
  }
  return res
}


