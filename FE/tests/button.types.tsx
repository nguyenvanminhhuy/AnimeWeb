import { Button } from '../src/components/ui/Button';

<Button label="Save" startIcon={<span />} endIcon={<span />} />;
<Button startIcon={<span />}>
  <strong>Rich content</strong>
</Button>;
<Button as="link" to="/anime" label="Explore" endIcon={<span />} />;
<Button as="anchor" href="#target" label="Jump" startIcon={<span />} />;
<Button aria-label="Close" startIcon={<span />} />;

// @ts-expect-error label and children are mutually exclusive.
<Button label="Save">Duplicate</Button>;
// @ts-expect-error the same content contract applies to React Router Link.
<Button as="link" to="/anime" label="Explore">
  Duplicate
</Button>;
// @ts-expect-error the same content contract applies to native anchors.
<Button as="anchor" href="#target" label="Jump">
  Duplicate
</Button>;
// @ts-expect-error Link cannot receive button loading state.
<Button as="link" to="/anime" label="Explore" loading />;
