const articleId = document.querySelector('#article').getAttribute('articleId');
const likeButton = document.querySelector('#like');

const comments = document.getElementById('comments');

const newComment = document.querySelector('#new__comment');
const newCommentBtn = newComment.querySelector('#new__comment button');
const newCommentTextarea = newComment.querySelector('#new__comment textarea');

const getLike = (articleId) => {
  const data = {
    articleId,
  };
  const xhr = new XMLHttpRequest();
  xhr.onload = () => {
    if (xhr.status === 200 || xhr.status === 201) {
      const result = JSON.parse(xhr.responseText);
    } else {
      console.error(xhr.responseText);
    }
  };
  xhr.open('POST', '/api/like');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(data));
}

const rewriteComments = async (commentsList, totalCount) => {
  const statusOne = commentsList.filter(c => c.status === 1);
  const user = await getUser();
  const lang = await getLang();
  const usePermissionImageBoolean = await usePermissionImage();
  let line = '';
  if (statusOne.length) {
    commentsList.forEach(c => {
      if (c.status) {
        line += `<div class="comment" aid="${articleId}" cid="${c.id}" pid="${c.comment_parent_id}" gid="${c.comment_group_id}">`;
        if (c.comment_parent_id) {
          line += `<div class="isReply"></div>`;
        }
        line += `<div class="comment__body">`;
        line += `<div class="info">`;
        line += `<div class="left">`;
        line += `<div class="user">`;
        if (usePermissionImageBoolean) {
          line += `<div class="permissionImage"><img src="/permission/${c.permission}.svg"></div>`;
        }
        line += `<div>${c.nickName}</div>`;
        line += `</div>`;
        if (c.likeCount) {
          line += `<div class="datetime">${c.datetime} / ${lang.comment_like} ${c.likeCount}</div>`;
        } else {
          line += `<div class="datetime">${c.datetime}</div>`;
        }
        line += `</div>`;
        line += `<div class="buttons">`;
        line += `<div class="likeBtn">`;
        if (c.userLike) {
          line += `<div class="comment_like"><button id="comment_like">${lang.comment_unlike}</button></div>`;
        } else {
          line += `<div class="comment_like"><button id="comment_like">${lang.comment_like}</button></div>`;
        }
        line += `<div class="comment_reply"><button id="comment_reply">${lang.comment_reply}</button></div>`;
        line += `</div>`;
        if (c.isAuthor || user.user.permission === 10) {
          line += `<div class="editBtn">`;
          line += `<div class="comment_edit"><button id="comment_edit">${lang.comment_edit}</button></div>`;
          line += `<div class="comment_delete"><button id="comment_delete">${lang.comment_delete}</button></div>`;
          line += `</div>`;
        }
        line += `</div>`;
        line += `</div>`;
        if (c.comment_parent_id && c.comment_parent_id !== c.comment_group_id) {
          line += `<div>@${c.parent.nickName}</div>`;
        }
        line += `<div class="content" id="comment_content">${c.content}</div>`;
        line += `<div class="reply" id="reply_content"></div>`;
        line += `<div class="comment_etc" id="comment_etc"></div>`;
        line += `</div>`;
        line += `</div>`;
      } else if (!c.status && c.replyCount) {
        line += `<div class="comment" aid="${articleId}" cid="${c.id}" gid="${c.comment_group_id}">`;
        if (c.comment_parent_id) {
          line += `<div class="isReply"></div>`;
        }
        line += `<div class="comment__body">`;
        line += `<div class="info">`;
        line += `<div class="left">`;
        line += `<div class="user">${c.user}</div>`;
        line += `<div class="datetime">${c.datetime}</div>`;
        line += `</div>`;
        line += `</div>`;
        line += `<div class="content" id="comment_content">${lang.comment_deletedComment}</div>`;
        line += `<div class="reply" id="reply_content"></div>`;
        line += `</div>`;
        line += `</div>`;
      }
      line += `</div>`;
    });
  }
  comments.innerHTML = line;
  addEvent();
};

const getComments = (articleId) => {
  const data = {
    articleId,
  };
  const xhr = new XMLHttpRequest();
  xhr.onload = () => {
    if (xhr.status === 200 || xhr.status === 201) {
      const result = JSON.parse(xhr.responseText);
      rewriteComments(result.comments, result.totalCount);
    } else {
      console.error(xhr.responseText);
    }
  };
  xhr.open('POST', '/api/comment/get');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(data));
};

const newCommentApi = (data) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = async () => {
      if (xhr.status === 200 || xhr.status === 201) {
        resolve(true);
      } else {
        console.error(xhr.responseText);
        reject(false);
      }
    };
    xhr.open('POST', '/api/comment/new');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
  });
};

if (newCommentBtn) {
  newCommentBtn.addEventListener('click', async () => {
    try {
      const { isLogin, message } = await getUser();
      if (isLogin) {
        const content = newComment.querySelector('textarea').value;
        const data = {
          articleId,
          content,
        };
        const result = await newCommentApi(data);
        if (result) {
          getComments(articleId);
          newComment.querySelector('textarea').value = '';
        }
      } else {
        alert(message);
      }
    } catch (e) {
      console.log(e);
    }
  });
}

const addEvent = async () => {
  try {
    const { isLogin, message } = await getUser();
    const lang = await getLang();
    likeButton.addEventListener('click', async () => {
      if (isLogin) {
        if (likeButton.className === `like`) {
          likeButton.innerHTML = `${lang.comment_unlike}`;
          likeButton.className =`like like-full`;
        } else {
          likeButton.innerHTML = `${lang.comment_like}`;
          likeButton.className =`like`;
        }
        getLike(articleId);
      } else {
        alert(message);
      }
    });

    // 코멘트 각각 기능 삽입
    const comments = document.querySelectorAll('.comment');
    comments.forEach(c => {
      const commentId = c.getAttribute('cid');
      const commentParentId = c.getAttribute('pid') || null;
      const commentGroupId = c.getAttribute('gid');
      const commentLikeBtn = c.querySelector('#comment_like');
      const commentReplyBtn = c.querySelector('#comment_reply');
      const commentEditBtn = c.querySelector('#comment_edit');
      const commentDeleteBtn = c.querySelector('#comment_delete');

      const commentEtc = c.querySelector('#comment_etc');

      if (commentLikeBtn) {
        commentLikeBtn.addEventListener('click', () => {
          if (isLogin) {
            const data = {
              commentId,
            };
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/comment/like');
            xhr.onload = () => {
              if (xhr.status === 200 || xhr.status === 201) {
                getComments(articleId);
              } else {
                console.error(xhr.responseText);
              }
            };
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
          } else {
            alert(message);
          }
        });
      }

      if (commentReplyBtn) {
        commentReplyBtn.addEventListener('click', () => {
          if (isLogin) {
            if (commentReplyBtn.textContent === `${lang.comment_reply}`) {
              commentReplyBtn.textContent = `${lang.comment_undoReply}`;
              if (commentEditBtn.textContent === `${lang.comment_undoEdit}`) {
                commentEditBtn.textContent = `${lang.comment_edit}`;
              }
              commentEtc.innerHTML = '';
              let line = ``;
              line += `<textarea name="reply" id="reply_text"></textarea>`;
              line += `<button id="reply_complete">${lang.comment_submit}</button>`;
              commentEtc.innerHTML = line;
              const replyCompleteBtn = c.querySelector('#reply_complete');
              replyCompleteBtn.addEventListener('click', () => {
                const content = c.querySelector('#reply_text').value;
                const commentParentId = commentId;
                const data = {
                  articleId,
                  commentParentId,
                  commentGroupId,
                  content,
                };
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/comment/reply');
                xhr.onload = () => {
                  if (xhr.status === 200 || xhr.status === 201) {
                    getComments(articleId);
                  } else {
                    console.error(xhr.responseText);
                  }
                };
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify(data));
              });
            } else {
              commentReplyBtn.textContent = `${lang.comment_reply}`;
              commentEtc.innerHTML = '';
            }
          } else {
            alert(message);
          }
        });
      }

      if (commentEditBtn) {
        commentEditBtn.addEventListener('click', () => {
          const commentContent = c.querySelector('#comment_content').textContent;
          if (commentEditBtn.textContent === `${lang.comment_edit}`) {
            commentEditBtn.textContent = `${lang.comment_undoEdit}`;
            if (commentReplyBtn.textContent === `${lang.comment_undoReply}`) commentReplyBtn.textContent = `${lang.comment_reply}`;
            commentEtc.innerHTML = '';
            let line = ``;
            line += `<textarea name="edit" id="edit_text">${commentContent}</textarea>`;
            line += `<button id="edit_complete">${lang.comment_submit}</button>`;
            commentEtc.innerHTML = line;
            const editCompleteBtn = c.querySelector('#edit_complete');
            editCompleteBtn.addEventListener('click', () => {
              const content = c.querySelector('#edit_text').value;
              const data = {
                commentId,
                content,
              };
              const xhr = new XMLHttpRequest();
              xhr.open('POST', '/api/comment/edit');
              xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 201) {
                  getComments(articleId);
                } else {
                  console.error(xhr.responseText);
                }
              };
              xhr.setRequestHeader('Content-Type', 'application/json');
              xhr.send(JSON.stringify(data));
            });
          } else {
            commentEditBtn.textContent = `${lang.comment_edit}`;
            commentEtc.innerHTML = '';
          }
        });
      }

      if (commentDeleteBtn) {
        commentDeleteBtn.addEventListener('click', (e) => {
          if (confirm(`${lang.comment_confirmDelete}`)) {
            e.stopImmediatePropagation();
            e.preventDefault();
            const data = {
              articleId,
              commentParentId,
              commentGroupId,
              commentId,
            };
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/comment/delete');
            xhr.onload = () => {
              if (xhr.status === 200 || xhr.status === 201) {
                getComments(articleId);
              } else {
                console.error(xhr.responseText);
              }
            };
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(data));
          }
        });
      }
    });
  } catch (e) {
    console.log(e);
  }
};

addEvent();