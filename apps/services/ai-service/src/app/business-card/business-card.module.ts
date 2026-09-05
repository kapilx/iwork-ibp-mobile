import { Module } from '@nestjs/common';
import { BusinessCardController } from './business-card.controller';
import { BusinessCardService } from './business-card.service';
import { ImageHelperModule } from '../image-helper/image-helper.module';
import { OpenAiModule } from '../open-ai/open-ai.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { InsuranceWellnessHubServiceLibModule } from '../../../../service-lib/src/lib/service-lib.module';

@Module({
  imports: [
    ImageHelperModule,
    OpenAiModule,
    InsuranceWellnessHubServiceLibModule,
    // MulterModule.register({
    //   storage: diskStorage({
    //     destination: '../uploads', // Change this to your desired upload directory
    //     filename: (req, file, cb) => {
    //       cb(null, `${Date.now()}-${file.originalname}`);
    //     },
    //   }),
    //   limits: {
    //     fileSize: 5 * 1024 * 1024, // Increase limit to 10MB if needed
    //   },
    // }),
   ],
  controllers: [BusinessCardController],
  providers: [BusinessCardService],
})
export class BusinessCardModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer
  //     .apply(FileUploadMiddleware)
  //     .forRoutes({ path: '/business-card/upload', method: RequestMethod.POST });
  // }
}