const articleId = document.querySelector('#article').getAttribute('articleId');
const likeButton = document.querySelector('#like');

const articleButtons = document.querySelector('.right .buttons');
const articlePopup = document.querySelector('.right .popUp');

if (articleButtons) {
  articleButtons.addEventListener('click', () => {
    articlePopup.classList.toggle('active');
  });
}

const comments = document.getElementById('comments');

const newComment = document.querySelector('#newComment');
const newCommentBtn = newComment.querySelector('#newComment button');
const newCommentTextarea = newComment.querySelector('#newComment textarea');

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
        line += `<div class="main">`;
        line += `<div class="info">`;
        line += `<div class="left">`;
        line += `<span class="permissionImage"><img src="/permission/${c.permission}.svg"></span>`;
        line += `<span class="nickName">${c.nickName}</span>`;
        line += `<span class="dear">님</span>`;
        line += `</div>`;
        line += `<div class="right">`;
        line += `<span class="datetime">${c.datetime}</span>`;
        line += `</div>`;
        line += `</div>`;
        if (c.likeCount) {
          line += `<div class="likeCount"><div class="likeWrap"><span><img src="/assets/empty.png"></span><span class="text">${c.likeCount}</span></div></div>`;
        }
        if (c.comment_parent_id && c.comment_parent_id !== c.comment_group_id) {
          line += `<div class="commentContent" id="commentContent">@${c.parent.nickName} ${c.content}</div>`;
        } else {
          line += `<div class="commentContent" id="commentContent">${c.content}</div>`;
        }
        line += `<div class="buttons">`;
        line += `<div class="left">`;
        line += `</div>`;
        line += `<div class="right">`;
        line += `<div class="likeBtn">`;
        line += `<div class="commentReply"><button id="commentReply">대댓글</button></div>`;
        if (c.userLike) {
          line += `<div class="commentLike"><button id="commentLike">공감취소</button></div>`;
        } else {
          line += `<div class="commentLike"><button id="commentLike">공감</button></div>`;
        }
        line += `</div>`;
        if (c.isAuthor || user.user.permission === 10) {
          line += `<div class="editBtn">`;
          line += `<div class="commentEdit"><button id="commentEdit">${lang.comment_edit}</button></div>`;
          line += `<div class="commentDelete"><button id="commentDelete">${lang.comment_delete}</button></div>`;
          line += `</div>`;
        }
        line += `</div>`;
        line += `</div>`;
        line += `<div class="commentEtc" id="commentEtc"></div>`;
        line += `</div>`;
        line += `</div>`;
      } else if (!c.status) {
        line += `<div class="comment" aid="${articleId}" cid="${c.id}" pid="${c.comment_parent_id}" gid="${c.comment_group_id}">`;
        if (c.comment_parent_id) {
          line += `<div class="isReply"></div>`;
        }
        line += `<div class="main">`;
        line += `<div class="info">`;
        line += `<span class="deleteComment">삭제된 댓글 입니다.</span>`;
        line += `</div>`;
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

if (likeButton) {
  likeButton.addEventListener('click', async () => {
    const { isLogin, message } = await getUser();
    const lang = await getLang();
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
}

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
        if (!content) {
          alert('내용을 입력해주세요');
        } else {
          const data = {
            articleId,
            content,
          };
          const result = await newCommentApi(data);
          if (result) {
            getComments(articleId);
            newComment.querySelector('textarea').value = '';
          }
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

    // 코멘트 각각 기능 삽입
    const comments = document.querySelectorAll('.comment');
    comments.forEach(c => {
      const commentId = c.getAttribute('cid');
      const commentParentId = c.getAttribute('pid') || null;
      const commentGroupId = c.getAttribute('gid');
      const commentLikeBtn = c.querySelector('#commentLike');
      const commentReplyBtn = c.querySelector('#commentReply');
      const commentEditBtn = c.querySelector('#commentEdit');
      const commentDeleteBtn = c.querySelector('#commentDelete');

      const commentEtc = c.querySelector('#commentEtc');

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
            if (commentReplyBtn.textContent === `대댓글`) {
              commentReplyBtn.textContent = `대댓글 취소`;
              if (commentEditBtn && commentEditBtn.textContent === `${lang.comment_undoEdit}`) {
                commentEditBtn.textContent = `${lang.comment_edit}`;
              }
              commentEtc.innerHTML = '';
              let line = ``;
              line += `<div class="etcCommentContainer">`;
              line += `<div class="etcCommentContent"><textarea name="reply" id="etcText" placeholder="답변을 작성해주세요"></textarea></div>`;
              line += `<div class="button"><button id="etcComplete">댓글 쓰기</button></div>`;
              line += `</div>`;
              commentEtc.innerHTML = line;
              const etcText = c.querySelector('#etcText');
              etcText.focus();
              const replyCompleteBtn = c.querySelector('#etcComplete');
              replyCompleteBtn.addEventListener('click', () => {
                const content = c.querySelector('#etcText').value;
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
              commentReplyBtn.textContent = `대댓글`;
              commentEtc.innerHTML = '';
            }
          } else {
            alert(message);
          }
        });
      }

      if (commentEditBtn) {
        commentEditBtn.addEventListener('click', () => {
          const commentContent = c.querySelector('#commentContent').textContent;
          if (commentEditBtn.textContent === `${lang.comment_edit}`) {
            commentEditBtn.textContent = `${lang.comment_undoEdit}`;
            if (commentReplyBtn.textContent === `${lang.comment_undoReply}`) commentReplyBtn.textContent = `${lang.comment_reply}`;
            commentEtc.innerHTML = '';
            let line = ``;
            line += `<div class="etcCommentContainer">`;
            line += `<div class="etcCommentContent"><textarea name="edit" id="etcText">${commentContent}</textarea></div>`;
            line += `<div class="button"><button id="etcComplete">${lang.comment_submit}</button></div>`;
            line += `</div>`
            commentEtc.innerHTML = line;
            const etcText = c.querySelector('#etcText');
            let text = etcText.innerHTML;
            if (text.charAt(text.length - 2) != '') {
              text += '';
            }
            etcText.focus();
            etcText.innerHTML = '';
            etcText.innerHTML = text;
            
            const editCompleteBtn = c.querySelector('#etcComplete');
            editCompleteBtn.addEventListener('click', () => {
              const content = c.querySelector('#etcText').value;
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