import { CsgoempireService } from "./services/csgoempire";
import { HelperService } from "./services/helper";

require('dotenv').config();

new CsgoempireService();
new HelperService();