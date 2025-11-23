import { Module } from '@nestjs/common';
import { WatsonxService } from './watsonx.service';

@Module({
  providers: [WatsonxService],
  exports: [WatsonxService],
})
export class IntegrationsModule {}
