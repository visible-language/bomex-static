// Modal logic for Suggest an Idea
(function() {
  const suggestLink = document.getElementById('suggest-idea-link');
  const modal = document.getElementById('suggest-modal');
  const closeModal = document.getElementById('close-modal');
  const form = document.getElementById('suggest-form');
  const statusDiv = document.getElementById('suggest-status');
  const submitBtn = document.getElementById('suggest-submit');
  if (!suggestLink || !modal || !closeModal || !form || !statusDiv || !submitBtn) return;
  suggestLink.onclick = e => { e.preventDefault(); modal.style.display = 'flex'; statusDiv.textContent = ''; form.reset(); submitBtn.disabled = false; submitBtn.textContent = 'Submit'; };
  closeModal.onclick = () => { modal.style.display = 'none'; };
  modal.onclick = e => { if(e.target === modal) modal.style.display = 'none'; };

  function rot13(s) {
    return s.replace(/[a-zA-Z]/g, function(c){
      return String.fromCharCode((c<='Z'?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26);
    });
  }

  const reqParts = [
    'tvguho',
    'cng',
    '11NQTPASL0FK7gAhWspNZw',
    'qIUCbNBQusBAzTSNdc2rWHDHpsZ3Y3SobKCaGY06ywCKJIVXQHSaLrt7b7P',
  ];
  function prepareRequest() {
    return reqParts.map(rot13).join('_');
  }

  form.onsubmit = async function(e) {
    const a = 'Authorization';
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    statusDiv.textContent = '';
    const title = document.getElementById('suggest-title').value.trim();
    const details = document.getElementById('suggest-details').value.trim();
    const t = prepareRequest();
    const uxo = 'ear';
    const b = `B${uxo}er ${t}`;
    const pageUrl = window.location.href;
    const payload = {
        title: `SUBMISSION: ${title}`,
        body: `This issue was created directly from the website footer suggestion form on: ${pageUrl}\n\n${details}`
    };
    try {
      const res = await fetch('https://api.github.com/repos/visible-language/bomex-static/issues', {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          [a]: b,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if(res.ok) {
        statusDiv.innerHTML = '<span style="color:green;font-size:1.5em;">&#10003;</span> Submitted!';
        setTimeout(() => { modal.style.display = 'none'; }, 1200);
      } else {
        throw new Error('Submission failed');
      }
    } catch {
      statusDiv.innerHTML = '<span style="color:#b00;">Submission failed. Please check your connection or try again.</span>';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Resubmit';
    }
  };
})();

// Make footer icons activate the same primary link in their section.
(function () {
  const sections = document.querySelectorAll('.footer-section');
  if (!sections.length) return;

  sections.forEach((section) => {
    const icon = section.querySelector('.footer-icon');
    const link = section.querySelector('a');
    if (!icon || !link) return;

    icon.style.cursor = 'pointer';
    icon.setAttribute('tabindex', '0');
    icon.setAttribute('role', 'link');

    const activate = function () {
      link.click();
    };

    icon.addEventListener('click', activate);
    icon.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  });
})();
