import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { Button } from '../../src/components/ui/Button';
import { Icon } from '../../src/components/ui/Icon';
import '../../src/styles/index.css';

function Fixture() {
  const [submitted, setSubmitted] = useState(0);
  const [clicked, setClicked] = useState(0);
  const location = useLocation();
  return (
    <main className="aw-shell tw:mx-auto">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted((value) => value + 1);
        }}
      >
        <Button
          id="both"
          label="Save"
          startIcon={<Icon name="search" label="Hidden slot" />}
          endIcon={<Icon name="arrow-right" />}
          onClick={() => setClicked((value) => value + 1)}
        />
        <Button id="rich" startIcon={<Icon name="check" />}>
          <strong>Rich content</strong>
        </Button>
        <Button id="plain" label="Plain" />
        <Button id="zero" label={0} />
        <Button id="only-icon" aria-label="Close" startIcon={<Icon name="close" />} />
        <Button
          id="loading"
          label="Working"
          loading
          startIcon={<Icon name="history" />}
          endIcon={<Icon name="arrow-right" />}
        />
        <Button id="submit" type="submit" label="Send" endIcon={<Icon name="arrow-right" />} />
      </form>
      <Button
        id="link"
        as="link"
        to="/next?kept=yes"
        label="Next"
        endIcon={<Icon name="arrow-right" />}
        ref={(element) => {
          if (element) element.dataset.refTag = element.tagName;
        }}
      />
      <Button
        id="anchor"
        as="anchor"
        href="#target"
        label="Jump"
        startIcon={<Icon name="arrow-down" />}
      />
      <div dir="rtl">
        <Button
          id="rtl"
          label="Save RTL"
          startIcon={<Icon name="search" />}
          endIcon={<Icon name="arrow-right" />}
        />
      </div>
      {['sm', 'md', 'lg'].map((size) => (
        <Button
          key={size}
          id={`size-${size}`}
          size={size}
          label="Sized"
          startIcon={<Icon name="search" />}
        />
      ))}
      <output id="submitted">{submitted}</output>
      <output id="clicked">{clicked}</output>
      <output id="location">{location.pathname + location.search}</output>
      <div id="target">Target</div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <MemoryRouter>
    <Fixture />
  </MemoryRouter>,
);
