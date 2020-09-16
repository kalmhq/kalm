export const sleep = async (time: number) => {
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};
