import { createRoot } from 'react-dom/client';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { iconDefinitions } from '@/components/ui/icon-definitions';
import '@/styles/index.css';

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
