import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { EventService } from './event.service';

describe('EventController', () => {
  /**
   * For unit tests we don't need to fire up the whole server. For each test, we create
   * the same limited dependency-injection container using Jest’s beforeEach. This
   * container instantiates only the listed controllers and providers and we can run
   * our unit tests on it.
   */

  let eventController: EventController;
  beforeEach(async () => {
    /**
     * Here we call the createTestingModule method of the Test class to create a new TestingModule
     * which we store in "app". During the creation we pass the controllers and providers we want
     * that testing module to have access to and then call the compile method on the TestingModule.
     */
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [EventService],
    }).compile();
    /**
     * .get() is a method on the TestingModule instance stored in app. It performs a lookup in the Nest
     * dependency-injection container. The generic type argument <EventController> tells TypeScript what
     * type we expect back, and the function argument (EventController) is the runtime token used to
     * retrieve the instance.
     */
    eventController = app.get<EventController>(EventController);
  });

  describe('Subtest', () => {
    it('1+1', () => {
      expect(1 + 1).toBe(2);
    });
  });
});
