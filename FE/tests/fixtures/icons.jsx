import { createRoot } from 'react-dom/client';
import { Icon } from '../../src/components/ui/Icon';
import { Button } from '../../src/components/ui/Button';
import { iconDefinitions } from '../../src/components/ui/iconDefinitions';
import '../../src/styles/index.css';

createRoot(document.getElementById('root')).render(
  <main className="container py-4">
    <div className="text-info" id="sizes">
      {['sm', 'md', 'lg'].map((size) => (
        <Icon key={size} name="search" size={size} data-size={size} />
      ))}
    </div>
    <Icon name="check" label="Saved successfully" id="semantic-icon" />
    <Button aria-label="Search" id="icon-button">
      <Icon name="search" />
    </Button>
    <div id="registry">
      {Object.keys(iconDefinitions).map((name) => (
        <Icon key={name} name={name} data-name={name} />
      ))}
    </div>
  </main>,
);
