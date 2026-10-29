import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Combobox } from '../../src/components/ui/Combobox';
import { Selectbox } from '../../src/components/ui/Selectbox';
import '../../src/styles/index.css';

const options = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
];

createRoot(document.getElementById('root')).render(
  <MemoryRouter>
    <main className="container py-4">
      <form id="controls">
        {/* Use real page shells to exercise their CSS overrides as well as common styles. */}
        {['sm', 'md', 'lg', undefined].map((size) => {
          const label = size ?? 'default';
          return (
            <section key={label} data-size={label} className="mb-4">
              <h2>{label}</h2>
              <div className="aw-hero-actions d-flex flex-wrap gap-3 tw:mt-6.25">
                <Button size={size} data-kind="button">
                  Action
                </Button>
                <Button as="link" to="/next" size={size} data-kind="link">
                  Next
                </Button>
                <Button as="anchor" href="#controls" size={size} data-kind="anchor">
                  Anchor
                </Button>
                <Button variant="quiet" size={size} data-kind="quiet">
                  Quiet
                </Button>
              </div>
              <div className="aw-auth-field tw:gap-2 tw:grid tw:min-w-0">
                <label htmlFor={`input-${label}`}>Input {label}</label>
                <Input
                  id={`input-${label}`}
                  name={`input-${label}`}
                  size={size}
                  data-kind="input"
                />
                <label htmlFor={`combo-${label}`}>Combobox {label}</label>
                <Combobox
                  id={`combo-${label}`}
                  name={`combo-${label}`}
                  size={size}
                  data-kind="combobox"
                  suggestions={['One', 'Two']}
                />
              </div>
              <div className="aw-explore tw:pt-7">
                <label htmlFor={`select-${label}`}>Selectbox {label}</label>
                <Selectbox
                  id={`select-${label}`}
                  name={`select-${label}`}
                  size={size}
                  data-kind="selectbox"
                  options={options}
                />
              </div>
            </section>
          );
        })}
        <Input id="native-width" htmlSize={30} variant="unstyled" defaultValue="native" />
        <Selectbox id="native-rows" htmlSize={3} size="sm" multiple options={options} />
        <Button id="unstyled" variant="unstyled">
          Unstyled action
        </Button>
        <Input id="unstyled-sized" variant="unstyled" size="lg" />
        <Input id="hidden" type="hidden" size="lg" name="hidden" value="kept" />
      </form>
    </main>
  </MemoryRouter>,
);
