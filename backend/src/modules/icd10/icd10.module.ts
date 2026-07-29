import { Module } from '@nestjs/common';
import { Icd10Service } from './icd10.service';
import { Icd10Controller } from './icd10.controller';

@Module({
  controllers: [Icd10Controller],
  providers: [Icd10Service],
  exports: [Icd10Service],
})
export class Icd10Module {}
