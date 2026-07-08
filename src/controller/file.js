import file from '../service/file';

module.exports = (router) => {
  const fileRouter = router.addMoudel('/file');

  fileRouter.post('/upload', ({ baseResponse, files }) => {
    return baseResponse.success(file.fileSave(files));
  }, 'form');
};
