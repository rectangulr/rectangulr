import { NgModule } from '@angular/core'
import { RectangulrModule } from 'rectangulr'
import { Main } from './main'

@NgModule({
  imports: [RectangulrModule],
  declarations: [Main],
  bootstrap: [Main],
})
export class AppModule {}
