(() => {
  const demos = [...document.querySelectorAll('.process-demo[data-process-scroll]')];

  demos.forEach(demo => {
    const steps = [...demo.querySelectorAll('.process-step')];
    const screens = [...demo.querySelectorAll('.demo-screen')];
    const label = demo.querySelector('.demo-stage-label');
    const caseLabel = demo.querySelector('.demo-case-label');
    const progress = demo.querySelector('.demo-progress-bar');
    const layout = demo.querySelector('.process-layout');

    if (!steps.length || steps.length !== screens.length || !label || !caseLabel || !progress || !layout) return;

    let currentStage = 1;
    let framePending = false;

    function showStage(stage, direction = stage >= currentStage ? 'forward' : 'backward') {
      const selectedStep = steps.find(step => Number(step.dataset.stage) === stage);
      if (!selectedStep) return;
      if (stage === currentStage && screens.some(screen => screen.classList.contains('is-active'))) return;

      steps.forEach(step => step.classList.toggle('is-active', Number(step.dataset.stage) === stage));
      screens.forEach(screen => {
        const active = Number(screen.dataset.screen) === stage;
        screen.classList.toggle('is-active', active);
        screen.classList.remove('stage-forward', 'stage-backward');
        if (active) screen.classList.add(direction === 'backward' ? 'stage-backward' : 'stage-forward');
      });

      label.textContent = `${String(stage).padStart(2, '0')} · ${selectedStep.dataset.stageLabel}`;
      caseLabel.textContent = selectedStep.dataset.caseLabel;
      progress.style.width = `${stage / steps.length * 100}%`;
      currentStage = stage;
    }

    function updateStageFromScroll() {
      framePending = false;
      if (window.matchMedia('(max-width: 760px)').matches) return;

      const section = layout.getBoundingClientRect();
      if (section.bottom < 0 || section.top > window.innerHeight) return;

      const readingLine = window.innerHeight * .46;
      let nearestStage = currentStage;
      let nearestDistance = Infinity;

      steps.forEach(step => {
        const rect = step.getBoundingClientRect();
        const distance = Math.abs((rect.top + rect.height / 2) - readingLine);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestStage = Number(step.dataset.stage);
        }
      });

      if (nearestStage !== currentStage) {
        showStage(nearestStage, nearestStage > currentStage ? 'forward' : 'backward');
      }
    }

    function requestStageUpdate() {
      if (framePending) return;
      framePending = true;
      window.requestAnimationFrame(updateStageFromScroll);
    }

    steps.forEach(step => {
      step.setAttribute('tabindex', '0');
      step.setAttribute('role', 'button');

      const activate = () => {
        const nextStage = Number(step.dataset.stage);
        showStage(nextStage, nextStage > currentStage ? 'forward' : 'backward');
        step.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };

      step.addEventListener('click', activate);
      step.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
    });

    window.addEventListener('scroll', requestStageUpdate, { passive: true });
    window.addEventListener('resize', requestStageUpdate);
    currentStage = 0;
    showStage(1, 'forward');
    requestStageUpdate();
  });
})();
