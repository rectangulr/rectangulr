import { Component, NgModule } from '@angular/core'
import * as rectangulr from '../public-api'
import { RectangulrModule } from '../public-api'

@Component({
  template: 'test',
})
export class Main {}

@NgModule({
  bootstrap: [Main],
  imports: [RectangulrModule],
  declarations: [Main],
})
export class AppModule {}

rectangulr
  .platform()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err))
