import {
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowUpRightFromSquare,
  faCheck,
  faEye,
  faClock,
  faHeart,
  faMagnifyingGlass,
  faPlay,
  faPenToSquare,
  faPlus,
  faRotateLeft,
  faTags,
  faTrashCan,
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
  eye: faEye,
  edit: faPenToSquare,
  trash: faTrashCan,
} as const;

export type IconName = keyof typeof iconDefinitions;
