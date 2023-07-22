import * as Yoga from 'typeflex'

describe('Yoga Layout - ', () => {
  it('child setMeasureFunc', async () => {
    const parent = Yoga.Node.create()
    parent.setWidth(5)

    const child = Yoga.Node.create()
    parent.insertChild(child, 0)
    // parent.setAlignItems(Yoga.ALIGN_FLEX_START)
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

export function debugYoga(node: Yoga.YogaNode) {
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

globalThis['debugYoga'] = debugYoga
