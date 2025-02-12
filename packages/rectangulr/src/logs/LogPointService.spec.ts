import { Component, signal } from "@angular/core"
import { TestBed } from "@angular/core/testing"
import { By } from "@angular/platform-browser"
import { LOGGER } from "../angular-terminal/logger"
import { LogPointService } from "./LogPointService"
import { TAGS } from "./Tags"
import { DomLog } from "./DomLog.directive"
import { H } from "../components/1-basics/h"

const mockLogger = { log: jasmine.createSpy('log') }

beforeEach(() => {
	TestBed.configureTestingModule({
		providers: [
			{ provide: LOGGER, useValue: mockLogger }
		]
	})
})

it('should match logpoint() alone', () => {
	const service = TestBed.inject(LogPointService)
	const root = TestBed.inject(LogPointService)

	root.lpSelectorString.$ = 'point'
	service.logPoint('point', 'test')
	expect(mockLogger.log).toHaveBeenCalledWith('test')

	root.lpSelectorString.$ = 'point'
	service.logPoint('point2', 'test2')
	expect(mockLogger.log).not.toHaveBeenCalledWith('test2')
})

it('should match logpoints through component tags', () => {
	@Component({
		selector: 'test-child',
		template: '',
		providers: [
			LogPointService,
			{ provide: TAGS, useValue: ['child-tag'] }
		],
		standalone: true,
	})
	class TestChildComponent {
		constructor(public logPoint: LogPointService) { }
	}

	@Component({
		selector: 'test-parent',
		template: '<test-child/>',
		providers: [
			LogPointService,
			{ provide: TAGS, useValue: ['parent-tag'] }
		],
		imports: [TestChildComponent]
	})
	class TestParentComponent { }

	const fixture = TestBed.createComponent(TestParentComponent)
	const childComponent = fixture.debugElement.query(By.directive(TestChildComponent))
	const childService = childComponent.injector.get(LogPointService)
	const root = TestBed.inject(LogPointService)

	fixture.detectChanges()

	root.lpSelectorString.$ = 'parent-tag,child-tag'
	childService.logPoint('point1', 'test')
	expect(mockLogger.log).toHaveBeenCalledWith('test')

	root.lpSelectorString.$ = 'wrong-tag,child-tag'
	childService.logPoint('point2', 'test2')
	expect(mockLogger.log).not.toHaveBeenCalledWith('test2')
})

it('should match logpoints through component + logPoint()', () => {
	@Component({
		selector: 'test-component',
		template: '',
		providers: [
			LogPointService,
			{ provide: TAGS, useValue: ['test-tag'] }
		],
		standalone: true,
	})
	class TestComponent {
		constructor(public logPoint: LogPointService) { }
	}

	const fixture = TestBed.createComponent(TestComponent)
	const service = fixture.debugElement.injector.get(LogPointService)
	const root = TestBed.inject(LogPointService)

	fixture.detectChanges()

	root.lpSelectorString.$ = 'test-tag,point'
	service.logPoint('point', 'test')
	expect(mockLogger.log).toHaveBeenCalledWith('test')

	root.lpSelectorString.$ = 'test-tag,point'
	service.logPoint('point2', 'test2')
	expect(mockLogger.log).not.toHaveBeenCalledWith('test2')
})

it('should log some dom activity when [domLog] directive is attached', () => {
	@Component({
		template: '<h domLog>{{text()}}</h>',
		providers: [
			LogPointService,
			{ provide: TAGS, useValue: ['test-tag'] }
		],
		imports: [H, DomLog]
	})
	class TestComponent {
		text = signal('aaa')
	}

	const fixture = TestBed.createComponent(TestComponent)
	const component = fixture.componentInstance
	const service = fixture.debugElement.injector.get(LogPointService)
	const root = TestBed.inject(LogPointService)

	root.lpSelectorString.$ = 'test-tag'
	component.text.set('bbb')
	fixture.detectChanges()
	expect(mockLogger.log).toHaveBeenCalled()
})