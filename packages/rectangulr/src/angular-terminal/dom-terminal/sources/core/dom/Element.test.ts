// @ts-nocheck
import { expect } from 'chai'

import { Point } from '../misc/Point'
import { StyleColor } from '../style/types/StyleColor'
import { StyleDisplay } from '../style/types/StyleDisplay'
import { StyleLength } from '../style/types/StyleLength'
import { StylePosition } from '../style/types/StylePosition'

import { TermElement } from './Element'

describe(`Element`, () => {
    describe(`#scrollIntoView`, () => {
        it(`should scroll until the element is on the top of the screen`, () => {
            let container = new TermElement()
            container.style.add({
                overflow: `hidden`,
                width: 100,
                height: 100,
            })

            let elementA = new TermElement()
            elementA.style.add({ height: 500 })
            elementA.appendTo(container)

            let elementB = new TermElement()
            elementB.style.add({
                position: `absolute`,
                left: 0,
                right: 0,
                top: 200,
                height: 10,
            })
            elementB.appendTo(container)

            container.triggerUpdates()

            elementB.scrollIntoView()

            expect(container.scrollTop).to.equal(110)
            expect(elementA.scrollTop).to.equal(0)
            expect(elementB.scrollTop).to.equal(0)
        })

        it(`should not scroll absolute containers that are inside the viewport`, () => {
            let container = new TermElement()
            container.style.add({
                overflow: `hidden`,
                width: 100,
                height: 100,
            })

            let elementA = new TermElement()
            elementA.style.position = `absolute`
            elementA.style.left = 0
            elementA.style.right = 0
            elementA.style.top = 0
            elementA.appendTo(container)

            let elementB = new TermElement()
            elementB.style.position = `absolute`
            elementB.style.left = 0
            elementB.style.right = 0
            elementB.style.top = 0
            elementB.style.height = 3
            elementB.style.border = `modern`
            elementB.appendTo(elementA)

            container.triggerUpdates()

            console.log(elementA.getElementRects())

            elementB.scrollCellIntoView(new Point({ x: 1, y: 1 }))

            expect(container.scrollTop).to.equal(0)
            expect(elementA.scrollTop).to.equal(0)
            expect(elementB.scrollTop).to.equal(0)
        })
    })

    describe(`#scrollRowIntoView`, () => {
        it(`should scroll until the specified row is on the top of the screen`, () => {
            let container = new TermElement()
            container.style.overflow = `hidden`
            container.style.width = 100
            container.style.height = 100

            let element = new TermElement()
            element.style.width = 100
            element.style.height = 200
            element.appendTo(container)

            container.triggerUpdates()

            container.scrollTop = 50

            expect(container.scrollTop).to.equal(50)

            container.scrollRowIntoView(25)

            expect(container.scrollTop).to.equal(25)
        })

        it(`should scroll until the specified row is on the bottom of the screen`, () => {
            let container = new TermElement()
            container.style.overflow = `hidden`
            container.style.width = 100
            container.style.height = 100

            let element = new TermElement()
            element.style.width = 100
            element.style.height = 200
            element.appendTo(container)

            container.triggerUpdates()

            container.scrollTop = 25

            expect(container.scrollTop).to.equal(25)

            container.scrollRowIntoView(150)

            expect(container.scrollTop).to.equal(51)
        })

        it(`should not scroll when the specified row is already in the viewport`, () => {
            let container = new TermElement()
            container.style.overflow = `hidden`
            container.style.width = 100
            container.style.height = 100

            let element = new TermElement()
            element.style.width = 100
            element.style.height = 200
            element.appendTo(container)

            container.triggerUpdates()

            container.scrollTop = 50

            expect(container.scrollTop).to.equal(50)

            container.scrollRowIntoView(75)

            expect(container.scrollTop).to.equal(50)

            container.scrollRowIntoView(125)

            expect(container.scrollTop).to.equal(50)
        })

        it(`should scroll its parent node as required to bring the line into the viewport`, () => {
            let container = new TermElement()
            container.style.overflow = `hidden`
            container.style.width = 100
            container.style.height = 100

            let elementA = new TermElement()
            elementA.style.overflow = `hidden`
            elementA.style.width = 100
            elementA.style.height = 200
            elementA.appendTo(container)

            let elementB = new TermElement()
            elementB.style.width = 100
            elementB.style.height = 600
            elementB.appendTo(elementA)

            container.triggerUpdates()

            elementB.scrollRowIntoView(400)

            expect(container.scrollTop).to.equal(100)
            expect(elementA.scrollTop).to.equal(201)
            expect(elementB.scrollTop).to.equal(0)
        })
    })

    describe(`#generateRenderList`, () => {
        it(`should correctly resolve a set of mixed elements (small test)`, () => {
            let elementA = new TermElement()
            elementA.name = `A`

            let elementB = new TermElement()
            elementB.name = `B`
            elementA.appendChild(elementB)
            elementB.style.zIndex = 2

            let elementC = new TermElement()
            elementC.name = `C`
            elementB.appendChild(elementC)

            let elementD = new TermElement()
            elementD.name = `D`
            elementA.appendChild(elementD)
            elementD.style.zIndex = 1

            let renderList = elementA.generateRenderList()

            expect(renderList).to.have.length(4)

            expect(renderList).to.have.property(0, elementC)
            expect(renderList).to.have.property(1, elementB)
            expect(renderList).to.have.property(2, elementD)
            expect(renderList).to.have.property(3, elementA)
        })

        it(`should correctly resolve a set of mixed elements (complex case)`, () => {
            let elementA = new TermElement()
            elementA.name = `A`

            let elementB = new TermElement()
            elementB.name = `B`
            elementA.appendChild(elementB)

            let elementC = new TermElement()
            elementC.name = `C`
            elementB.appendChild(elementC)
            elementC.style.zIndex = 1

            let elementD = new TermElement()
            elementD.name = `D`
            elementB.appendChild(elementD)

            let elementE = new TermElement()
            elementE.name = `E`
            elementD.appendChild(elementE)
            elementE.style.zIndex = 3

            let elementF = new TermElement()
            elementF.name = `F`
            elementB.appendChild(elementF)
            elementF.style.zIndex = 2

            let elementG = new TermElement()
            elementG.name = `G`
            elementF.appendChild(elementG)

            let elementH = new TermElement()
            elementH.name = `H`
            elementA.appendChild(elementH)
            elementH.style.zIndex = 2

            let renderList = elementA.generateRenderList()

            expect(renderList).to.have.length(8)

            expect(renderList).to.have.property(0, elementE)
            expect(renderList).to.have.property(1, elementH)
            expect(renderList).to.have.property(2, elementG)
            expect(renderList).to.have.property(3, elementF)
            expect(renderList).to.have.property(4, elementC)
            expect(renderList).to.have.property(5, elementD)
            expect(renderList).to.have.property(6, elementB)
            expect(renderList).to.have.property(7, elementA)
        })
    })

    describe(`#style`, () => {
        it(`should start with default values`, () => {
            let element = new TermElement()

            expect(element.style.display()).to.equal(StyleDisplay.flex)
        })

        it(`should accept valid property values`, () => {
            let element = new TermElement()

            element.style.display = null
            expect(element.style.display).to.equal(null)

            element.style.display = `flex`
            expect(element.style.display).to.equal(`flex`)

            element.style.left = 100
            expect(element.style.left).to.equal(100)

            element.style.left = `100`
            expect(element.style.left).to.equal(100)

            element.style.left = `100%`
            expect(element.style.left).to.equal(`100%`)

            element.style.left = `auto`
            expect(element.style.left).to.equal(`auto`)

            element.style.backgroundColor = `red`
            expect(element.style.backgroundColor).to.equal(`#ff0000`)

            element.style.backgroundColor = `#FF0000`
            expect(element.style.backgroundColor).to.equal(`#ff0000`)

            element.style.backgroundColor = null
            expect(element.style.backgroundColor).to.equal(null)

            element.style.backgroundCharacter = `x`
            expect(element.style.backgroundCharacter).to.equal(`x`)
        })

        it(`should not accept invalid property values`, () => {
            let element = new TermElement()

            expect(() => {
                element.style.display = `lolno`
            }).to.throw(Error)
            expect(element.style.display).to.equal(StyleDisplay.flex)

            expect(() => {
                element.style.color = 42
            }).to.throw(Error)
            expect(element.style.color).to.equal(null)

            expect(() => {
                element.style.backgroundCharacter = `Super`
            }).to.throw(Error)
            expect(element.style.backgroundCharacter).to.equal(` `)

            expect(() => {
                element.style.backgroundCharacter = ``
            }).to.throw(Error)
            expect(element.style.backgroundCharacter).to.equal(` `)
        })

        it(`should correctly parse style properties and make them accessible via $`, () => {
            let element = new TermElement()

            element.style.display = null
            expect(element.style.display).to.equal(null)

            element.style.display = `flex`
            expect(element.style.display).to.equal(StyleDisplay.flex)

            element.style.position = `fixed`
            expect(element.style.position).to.equal(StylePosition.fixed)
        })

        it(`should support shorthand properties`, () => {
            let element = new TermElement()

            element.style.padding = 1
            expect(element.style.paddingLeft)
                .to.be.instanceof(StyleLength)
                .and.to.deep.equal(new StyleLength(1))
            expect(element.style.paddingRight)
                .to.be.instanceof(StyleLength)
                .and.to.deep.equal(new StyleLength(1))
            expect(element.style.paddingTop)
                .to.be.instanceof(StyleLength)
                .and.to.deep.equal(new StyleLength(1))
            expect(element.style.paddingBottom)
                .to.be.instanceof(StyleLength)
                .and.to.deep.equal(new StyleLength(1))

            element.style.padding = [1, 2]
            expect(element.style.paddingLeft)
                .to.be.instanceof(StyleLength)
                .and.to.deep.equal(new StyleLength(2))
            expect(element.style.paddingRight)
                .to.be.instanceof(StyleLength)
                .and.to.deep.equal(new StyleLength(2))
            expect(element.style.paddingTop)
                .to.be.instanceof(StyleLength)
                .and.to.deep.equal(new StyleLength(1))
            expect(element.style.paddingBottom)
                .to.be.instanceof(StyleLength)
                .and.to.deep.equal(new StyleLength(1))

            element.style.padding = [1, 2, 3, 4]
            expect(element.style.paddingLeft)
                .to.be.instanceof(StyleLength)
                .and.to.deep.equal(new StyleLength(4))
            expect(element.style.paddingRight)
                .to.be.instanceof(StyleLength)
                .and.to.deep.equal(new StyleLength(2))
            expect(element.style.paddingTop)
                .to.be.instanceof(StyleLength)
                .and.to.deep.equal(new StyleLength(1))
            expect(element.style.paddingBottom)
                .to.be.instanceof(StyleLength)
                .and.to.deep.equal(new StyleLength(3))
        })

        it(`should correctly inherit properties when adding a node to another`, () => {
            let elementA = new TermElement()
            elementA.style.color = `red`

            let elementB = new TermElement()
            elementB.style.color = `inherit`

            expect(elementB.style.color).to.equal(null)

            elementB.appendTo(elementA)

            expect(elementB.style.color).to.deep.equal(new StyleColor(`#ff0000`))
        })

        it(`should correctly inherit properties when a parent changes its own property (one level)`, () => {
            let elementA = new TermElement()
            elementA.style.color = `red`

            let elementB = new TermElement()
            elementB.style.color = `inherit`
            elementB.appendTo(elementA)

            expect(elementB.style.color).to.deep.equal(new StyleColor(`#ff0000`))

            elementA.style.color = `blue`

            expect(elementB.style.color).to.deep.equal(new StyleColor(`#0000ff`))
        })

        it(`should correctly inherit properties when a parent changes its own property (two levels)`, () => {
            let elementA = new TermElement()
            elementA.style.color = `red`

            let elementB = new TermElement()
            elementB.style.color = `inherit`
            elementB.appendTo(elementA)

            let elementC = new TermElement()
            elementC.style.color = `inherit`
            elementC.appendTo(elementB)

            expect(elementC.style.color).to.deep.equal(new StyleColor(`#ff0000`))

            elementA.style.color = `blue`

            expect(elementC.style.color).to.deep.equal(new StyleColor(`#0000ff`))
        })
    })
})
