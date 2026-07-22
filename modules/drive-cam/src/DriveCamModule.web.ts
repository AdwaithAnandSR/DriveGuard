import { registerWebModule, NativeModule } from 'expo';

import { DriveCamModuleEvents } from './DriveCam.types';

// DriveCamModule is not available on the web platform.
class DriveCamModule extends NativeModule<DriveCamModuleEvents> {}

export default registerWebModule(DriveCamModule, 'DriveCamModule');
