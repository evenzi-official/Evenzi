/* Filter pill toggle — updates body[data-ownership] / body[data-time] */
(function () {
  var titleEl = document.getElementById('dash-title');
  function setActive(group, value) {
    document.body.dataset[group === 'ownership' ? 'ownership' : 'time'] = value;
    var attr = group === 'ownership' ? 'data-set-ownership' : 'data-set-time';
    document.querySelectorAll('[' + attr + ']').forEach(function (el) {
      var match = el.getAttribute(attr) === value;
      el.classList.toggle('is-active', match);
      el.setAttribute('aria-checked', match ? 'true' : 'false');
    });
    if (group === 'ownership' && titleEl) {
      titleEl.textContent = value === 'collab' ? 'Event Collaborations' : 'Your Events';
    }
  }
  document.querySelectorAll('[data-set-ownership]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); setActive('ownership', b.dataset.setOwnership); });
  });
  document.querySelectorAll('[data-set-time]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); setActive('time', b.dataset.setTime); });
  });
})();
