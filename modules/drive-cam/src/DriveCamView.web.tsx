import { DriveCamViewProps } from './DriveCam.types';

// DriveCamView is not available on the web platform.
export default function DriveCamView(_props: DriveCamViewProps) {
  throw new Error('DriveCamView is not available on the web platform.');
}
