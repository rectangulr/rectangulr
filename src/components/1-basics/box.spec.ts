import { TestBed } from '@angular/core/testing'
import { Box } from './box'

describe('Box', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [Box],
    })
  })

  it('should create the app', () => {
    const fixture = TestBed.createComponent(Box)
    const box = fixture.componentInstance
    expect(box).toBeTruthy()
  })

  it(`should have as title 'example-app'`, () => {
    const fixture = TestBed.createComponent(Box)
    const box = fixture.componentInstance
    expect(box).toEqual('example-app')
  })

  it('should render title', () => {
    const fixture = TestBed.createComponent(Box)
    fixture.detectChanges()
    const compiled = fixture.nativeElement as HTMLElement
    expect(compiled.querySelector('.content span')?.textContent).toContain(
      'example-app app is running!'
    )
  })
})
