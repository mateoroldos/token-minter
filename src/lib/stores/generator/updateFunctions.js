import { get } from 'svelte/store';
import { activeStep, stepsArray } from './generatorGeneralStore';

export const saveFileInStore = (store, file) => {
  store.set(file);
};

export const setValidationError = (store, message) => {
  store.update((s) => ({
    uploadState: 'invalid',
    errorMessages: [message],
  }));
};

export const setValidationSuccess = (store) => {
  store.update((s) => ({
    uploadState: 'success',
    errorMessages: [],
  }));
};

export const onNext = (stepFunction) => {
  if (stepFunction) {
    changeStepState(get(activeStep), 'loading');
    let promise = new Promise(async (resolve, reject) => {
      let stepJob = await stepFunction();
      console.log('stepJob', stepFunction);
      if (stepJob === true) {
        resolve('success');
      } else {
        reject(stepJob.error);
      }
    });
    promise
      .then(() => {
        activeStep.update((current) => current + 1);
        changeStepState(get(activeStep), 'success');
      })
      .catch((message) => {
        changeStepState(get(activeStep), 'error');
        alert(message);
      });
  } else {
    activeStep.update((current) => current + 1);
    changeStepState(get(activeStep), 'success');
  }
};

export const onBack = () => {
  activeStep.update((current) => current - 1);
};

export const changeStepState = (stepNumber, state) => {
  stepsArray.update((steps) => {
    steps[stepNumber].state = state;
    return steps;
  });
};
