import atLibServices from '~services';

import Base from '~models/Base';
import Config from '~models/Config';
import Credential from '~models/Credential';
import CredentialType from '~models/CredentialType';
import Inventory from '~models/Inventory';
import InventoryScript from '~models/InventoryScript';
import InventorySource from '~models/InventorySource';
import JobTemplate from '~models/JobTemplate';
import Me from '~models/Me';
import ModelsStrings from '~models/models.strings';
import NotificationTemplate from '~models/NotificationTemplate';
import Organization from '~models/Organization';
import Project from '~models/Project';
import WorkflowJobTemplate from '~models/WorkflowJobTemplate';
import WorkflowJobTemplateNode from '~models/WorkflowJobTemplateNode';

const MODULE_NAME = 'at.lib.models';

angular
    .module(MODULE_NAME, [
        atLibServices
    ])
    .service('BaseModel', Base)
    .service('ConfigModel', Config)
    .service('CredentialModel', Credential)
    .service('CredentialTypeModel', CredentialType)
    .service('InventoryModel', Inventory)
    .service('InventoryScriptModel', InventoryScript)
    .service('InventorySourceModel', InventorySource)
    .service('JobTemplateModel', JobTemplate)
    .service('MeModel', Me)
    .service('ModelsStrings', ModelsStrings)
    .service('NotificationTemplate', NotificationTemplate)
    .service('OrganizationModel', Organization)
    .service('ProjectModel', Project)
    .service('WorkflowJobTemplateModel', WorkflowJobTemplate)
    .service('WorkflowJobTemplateNodeModel', WorkflowJobTemplateNode);

export default MODULE_NAME;
