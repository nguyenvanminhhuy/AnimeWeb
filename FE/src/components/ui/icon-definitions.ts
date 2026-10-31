import {
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowUpRightFromSquare,
  faCheck,
  faClock,
  faHeart,
  faMagnifyingGlass,
  faPlay,
  faPlus,
  faRotateLeft,
  faTags,
  faUsers,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartOutline } from '@fortawesome/free-regular-svg-icons';

export const iconDefinitions = {
  search: faMagnifyingGlass,
  heart: faHeartOutline,
  'heart-filled': faHeart,
  play: faPlay,
  history: faClock,
  'external-link': faArrowUpRightFromSquare,
  'arrow-left': faArrowLeft,
  'arrow-right': faArrowRight,
  'arrow-down': faArrowDown,
  replay: faRotateLeft,
  close: faXmark,
  check: faCheck,
  plus: faPlus,
  tags: faTags,
  users: faUsers,
} as const;

export type IconName = keyof typeof iconDefinitions;
