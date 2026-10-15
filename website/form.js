/*
  Contact form helper, shared by every page.

  - Pre-selects "What are you interested in?" from the form's data-interest
    attribute (set per page) or from ?interest= in the URL.
  - Records where the visitor came from in a hidden "source" field:
    ?source=... in the link (e.g. ?source=linkedin-featured-cso) wins,
    otherwise the referring site, otherwise "direct". The source is kept for
    the rest of the visit, so it survives moving between pages.
  - Sends the form to Formspree in the background and shows a confirmation
    on the page. Without JavaScript the form still posts normally.
*/
(function () {
  var form = document.querySelector('form.contact-form');
  if (!form) return;

  var params = new URLSearchParams(window.location.search);

  // ── Where did this visitor come from? ──
  var source = params.get('source') || params.get('utm_source');
  try {
    if (source) {
      sessionStorage.setItem('jk_source', source);
    } else {
      source = sessionStorage.getItem('jk_source');
    }
  } catch (e) { /* storage blocked — fine, fall through */ }

  if (!source) {
    source = document.referrer ? 'referrer: ' + document.referrer : 'direct';
  }

  var sourceField = form.querySelector('input[name="source"]');
  var pageField = form.querySelector('input[name="page"]');
  if (sourceField) sourceField.value = source;
  if (pageField) pageField.value = window.location.pathname;

  // ── Pre-select the interest ──
  var select = form.querySelector('select[name="interest"]');
  var wanted = params.get('interest') || form.getAttribute('data-interest');
  if (select && wanted) {
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value === wanted) { select.selectedIndex = i; break; }
    }
  }

  // ── Send in the background ──
  var subjectField = form.querySelector('input[name="_subject"]');
  var success = document.querySelector('.form-success');
  var error = document.querySelector('.form-error');
  var button = form.querySelector('.form-submit');

  form.addEventListener('submit', function (event) {
    if (!window.fetch || !window.FormData) return; // let the browser post normally
    event.preventDefault();

    if (subjectField && select) {
      subjectField.value = 'Website enquiry: ' + select.options[select.selectedIndex].text;
    }

    button.disabled = true;
    button.textContent = 'Sending…';
    if (error) error.hidden = true;

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Form error ' + response.status);
        form.hidden = true;
        if (success) {
          success.hidden = false;
          success.focus();
        }
      })
      .catch(function () {
        button.disabled = false;
        button.textContent = 'Send message';
        if (error) error.hidden = false;
      });
  });
})();
