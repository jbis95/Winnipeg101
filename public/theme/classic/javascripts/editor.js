const _uploadAdapters = [];

function onSubmit() {
  if (!frm.title.value) {
    alert('제목을 입력해주세요');
    return false;
  }

  const content = document.querySelector('.ck-content');
  if (content.innerHTML === '<p><br data-cke-filler="true"></p>') {
    alert('내용을 입력해주세요');
    return false;
  }

  if (_uploadAdapters.length > 0 && _uploadAdapters.some(e => e.isUploadCompleted() === false)) {
    alert('파일 업로드가 완료되지 않았습니다.');
    return false;
  }

  return true;
}

(async () => {
  const language = await getCountryCode();

  function MyCustomUploadAdapterPlugin(editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
      const adapter = new CkEditorFileUploadAdapter(loader);
      _uploadAdapters.push(adapter);
      return adapter;
    };
  };
  ClassicEditor
    .create(document.querySelector('#editor'), {
      extraPlugins: [MyCustomUploadAdapterPlugin],
      toolbar: [
        'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'outdent', 'indent', '|', 'imageUpload', 'blockQuote', 'insertTable', 'mediaEmbed', 'undo', 'redo',
      ],
      language,
    })
    .catch(error => {
      console.error(error);
    });
})();
