/** ***********************************************
 * Copyright (c) 2016 Ansible, Inc.
 *
 * All Rights Reserved
 ************************************************ */

const ALERT_MISSING = 'Template parameter is missing';
const ALERT_NO_PERMISSION = 'You do not have permission to perform this action.';
const ALERT_UNKNOWN = 'We were unable to determine this template\'s type';
const ALERT_UNKNOWN_COPY = `${ALERT_UNKNOWN} while copying.`;
const ALERT_UNKNOWN_DELETE = `${ALERT_UNKNOWN} while deleting.`;
const ALERT_UNKNOWN_EDIT = `${ALERT_UNKNOWN} while routing to edit.`;
const ALERT_UNKNOWN_LAUNCH = `${ALERT_UNKNOWN} while launching.`;
const ALERT_UNKNOWN_SCHEDULE = `${ALERT_UNKNOWN} while routing to schedule.`;
const ERROR_EDIT = 'Error: Unable to edit template';
const ERROR_DELETE = 'Error: Unable to delete template';
const ERROR_LAUNCH = 'Error: Unable to launch template';
const ERROR_UNKNOWN = 'Error: Unable to determine template type';
const ERROR_JOB_COPY = 'Error: Unable to copy job';
const ERROR_JOB_SCHEDULE = 'Error: Unable to schedule job';
const ERROR_TEMPLATE_COPY = 'Error: Unable to copy job template';
const ERROR_WORKFLOW_COPY = 'Error: Unable to copy workflow job template';

const JOB_TEMPLATE_ALIASES = ['job_template', 'Job Template'];
const WORKFLOW_TEMPLATE_ALIASES = ['workflow_job_template', 'Workflow Job Template'];

const isJobTemplate = obj => _.includes(JOB_TEMPLATE_ALIASES, _.get(obj, 'type'));
const isWorkflowTemplate = obj => _.includes(WORKFLOW_TEMPLATE_ALIASES, _.get(obj, 'type'));

function TemplatesListController (
    $scope,
    $rootScope,
    Alert,
    TemplateList,
    Prompt,
    ProcessErrors,
    GetBasePath,
    InitiatePlaybookRun,
    Wait,
    $state,
    $filter,
    Dataset,
    rbacUiControlService,
    TemplatesService,
    qs,
    TemplateCopyService,
    i18n,
    JobTemplate,
    TemplatesStrings
) {
    const jobTemplate = new JobTemplate();
    const list = TemplateList;

    init();

    function init () {
        $scope.canAdd = false;

        rbacUiControlService.canAdd('job_templates').then(params => {
            $scope.canAddJobTemplate = params.canAdd;
        });

        rbacUiControlService.canAdd('workflow_job_templates').then(params => {
            $scope.canAddWorkflowJobTemplate = params.canAdd;
        });

        // search init
        $scope.list = list;
        $scope[`${list.iterator}_dataset`] = Dataset.data;
        $scope[list.name] = $scope[`${list.iterator}_dataset`].results;
        $scope.options = {};

        $rootScope.flashMessage = null;
    }

    $scope.$on(`${list.iterator}_options`, (event, data) => {
        $scope.options = data.data.actions.GET;
        optionsRequestDataProcessing();
    });

    $scope.$watchCollection('templates', () => {
        optionsRequestDataProcessing();
    });

    $scope.$on('ws-jobs', () => {
        const path = GetBasePath(list.basePath) || GetBasePath(list.name);
        qs.search(path, $state.params[`${list.iterator}_search`])
            .then(searchResponse => {
                $scope[`${list.iterator}_dataset`] = searchResponse.data;
                $scope[list.name] = $scope[`${list.iterator}_dataset`].results;
            });
    });

    // iterate over the list and add fields like type label, after the
    // OPTIONS request returns, or the list is sorted/paginated/searched
    function optionsRequestDataProcessing () {
        $scope[list.name].forEach((item, idx) => {
            const itm = $scope[list.name][idx];
            // Set the item type label
            if (list.fields.type && _.has($scope.options, 'type.choices')) {
                $scope.options.type.choices.forEach(choice => {
                    if (choice[0] === item.type) {
                        [itm.type_label] = choice;
                    }
                });
            }
        });
    }

    $scope.editJobTemplate = template => {
        if (!template) {
            Alert(ERROR_EDIT, ALERT_MISSING);
            return;
        }

        if (isJobTemplate(template)) {
            $state.transitionTo('templates.editJobTemplate', { job_template_id: template.id });
        } else if (isWorkflowTemplate(template)) {
            $state.transitionTo('templates.editWorkflowJobTemplate', { workflow_job_template_id: template.id });
        } else {
            Alert(ERROR_UNKNOWN, ALERT_UNKNOWN_EDIT);
        }
    };

    $scope.submitJob = template => {
        if (!template) {
            Alert(ERROR_LAUNCH, ALERT_MISSING);
            return;
        }

        if (isJobTemplate(template)) {
            InitiatePlaybookRun({ scope: $scope, id: template.id, job_type: 'job_template' });
        } else if (isWorkflowTemplate(template)) {
            InitiatePlaybookRun({ scope: $scope, id: template.id, job_type: 'workflow_job_template' });
        } else {
            Alert(ERROR_UNKNOWN, ALERT_UNKNOWN_LAUNCH);
        }
    };

    $scope.scheduleJob = template => {
        if (!template) {
            Alert(ERROR_JOB_SCHEDULE, ALERT_MISSING);
            return;
        }

        if (isJobTemplate(template)) {
            $state.go('jobTemplateSchedules', { id: template.id });
        } else if (isWorkflowTemplate(template)) {
            $state.go('workflowJobTemplateSchedules', { id: template.id });
        } else {
            Alert(ERROR_UNKNOWN, ALERT_UNKNOWN_SCHEDULE);
        }
    };

    $scope.deleteJobTemplate = template => {
        if (!template) {
            Alert(ERROR_DELETE, ALERT_MISSING);
            return;
        }

        if (isWorkflowTemplate(template)) {
            const body = TemplatesStrings.get('deleteResource.CONFIRM', 'workflow job template');
            $scope.displayTemplateDeletePrompt(template, body);
        } else if (isJobTemplate(template)) {
            jobTemplate.getDependentResourceCounts(template.id)
                .then(counts => {
                    const body = buildTemplateDeletePromptBodyHTML(counts);
                    $scope.displayTemplateDeletePrompt(template, body);
                });
        } else {
            Alert(ERROR_UNKNOWN, ALERT_UNKNOWN_DELETE);
        }
    };

    $scope.displayTemplateDeletePrompt = (template, body) => {
        const action = () => {
            function handleSuccessfulDelete (isWorkflow) {
                let reloadListStateParams = null;
                let stateParamID;

                if (isWorkflow) {
                    stateParamID = $state.params.workflow_job_template_id;
                } else {
                    stateParamID = $state.params.job_template_id;
                }

                const templateSearch = _.get($state.params, 'template_search');
                const { page } = templateSearch;

                if ($scope.templates.length === 1 && !_.isEmpty(page) && page !== '1') {
                    reloadListStateParams = _.cloneDeep($state.params);

                    const pageNum = (parseInt(reloadListStateParams.template_search.page, 0) - 1);
                    reloadListStateParams.template_search.page = pageNum.toString();
                }

                if (parseInt(stateParamID, 0) === template.id) {
                    $state.go('templates', reloadListStateParams, { reload: true });
                } else {
                    $state.go('.', reloadListStateParams, { reload: true });
                }

                Wait('stop');
            } // end handler

            let deleteServiceMethod;
            let failMsg;

            if (isWorkflowTemplate(template)) {
                deleteServiceMethod = TemplatesService.deleteWorkflowJobTemplate;
                failMsg = 'Call to delete workflow job template failed. DELETE returned status: ';
            } else if (isJobTemplate(template)) {
                deleteServiceMethod = TemplatesService.deleteJobTemplate;
                failMsg = 'Call to delete job template failed. DELETE returned status: ';
            } else {
                Alert(ERROR_UNKNOWN, ALERT_UNKNOWN_DELETE);
                return;
            }

            $('#prompt-modal').modal('hide');
            Wait('start');

            deleteServiceMethod(template.id)
                .then(() => handleSuccessfulDelete(isWorkflowTemplate(template)))
                .catch(res => {
                    ProcessErrors($scope, res.data, res.status, null, {
                        hdr: 'Error!',
                        msg: `${failMsg} ${res.status}.`
                    });
                });
        }; // end action

        Prompt({
            action,
            actionText: 'DELETE',
            body,
            hdr: i18n._('Delete'),
            resourceName: $filter('sanitize')(template.name)
        });
    };

    $scope.displayWorkflowTemplateCopyPrompt = (template, body) => {
        Prompt({
            hdr: 'Copy Workflow',
            body,
            action () {
                $('#prompt-modal').modal('hide');
                Wait('start');
                TemplateCopyService.copyWorkflow(template.id)
                    .then(res => {
                        Wait('stop');
                        const destination = 'templates.editWorkflowJobTemplate';
                        const opts = { workflow_job_template_id: res.data.id };
                        $state.go(destination, opts, { reload: true });
                    }, data => {
                        const { status } = data;
                        Wait('stop');
                        ProcessErrors($scope, data, status, null, {
                            hdr: 'Error!',
                            msg: `Call to copy template failed. POST returned status: ${status}.`
                        });
                    });
            },
            actionText: 'COPY',
            class: 'Modal-primaryButton'
        });
    };

    $scope.copyTemplate = template => {
        if (!template) {
            Alert(ERROR_TEMPLATE_COPY, ALERT_MISSING);
            return;
        }

        if (isJobTemplate(template)) {
            Wait('start');
            TemplateCopyService.get(template.id)
                .then(response => {
                    TemplateCopyService.set(response.data.results)
                        .then(obj => {
                            Wait('stop');
                            if (isJobTemplate(obj)) {
                                $state.go('templates.editJobTemplate', { job_template_id: obj.id }, { reload: true });
                            }
                        })
                        .catch(({ data, status }) => {
                            ProcessErrors($scope, data, status, null, {
                                hdr: 'Error!',
                                msg: `Call failed. Return status: ${status}`
                            });
                        });
                })
                .catch(({ data, status }) => {
                    ProcessErrors($rootScope, data, status, null, {
                        hdr: 'Error!',
                        msg: `Call failed. Return status: ${status}`
                    });
                });
        } else if (isWorkflowTemplate(template)) {
            TemplateCopyService.getWorkflowCopy(template.id)
                .then(result => {
                    if (result.data.can_copy && result.data.can_copy_without_user_input) {
                        // Go ahead and copy the workflow - the user has full priveleges
                        // on all the resources.
                        const copyName = TemplateCopyService.getWorkflowCopyName(template.name);
                        TemplateCopyService.copyWorkflow(template.id, copyName)
                            .then(res => {
                                const params = { workflow_job_template_id: res.data.id };
                                $state.go('templates.editWorkflowJobTemplate', params, { reload: true });
                            })
                            .catch(response => {
                                Wait('stop');
                                ProcessErrors($scope, response.data, response.status, null, {
                                    hdr: 'Error!',
                                    msg: `Call to copy workflow job template failed. Return status: ${response.status}.`
                                });
                            });
                    } else if (result.data.can_copy) {
                        const body = buildWorkflowCopyPromptBodyHTML({
                            templates: result.data.job_template_unable_to_copy,
                            credentials: result.data.credentials_unable_to_copy,
                            inventories: result.data.inventories_unable_to_copy
                        });
                        $scope.displayWorkflowTemplateCopyPrompt(template, body);
                    } else {
                        Alert(ERROR_WORKFLOW_COPY, ALERT_NO_PERMISSION);
                    }
                }, rejection => {
                    const { status } = rejection;
                    Wait('stop');
                    ProcessErrors($scope, rejection, status, null, {
                        hdr: 'Error!',
                        msg: `Call to copy template failed. GET returned status: ${status}`
                    });
                });
        } else {
            Alert(ERROR_UNKNOWN, ALERT_UNKNOWN_COPY);
        }
    };

    function buildTemplateDeletePromptBodyHTML (dependentResourceCounts) {
        const invalidateRelatedLines = [];

        let bodyHTML = `
            <div class="Prompt-bodyQuery">
                ${TemplatesStrings.get('deleteResource.CONFIRM', 'job template')}
            </div>`;

        dependentResourceCounts.forEach(countObj => {
            if (countObj.count && countObj.count > 0) {
                invalidateRelatedLines.push(`<div>
                    <span class="Prompt-warningResourceTitle">
                        ${countObj.label}
                    </span>
                    <span class="badge List-titleBadge">
                        ${countObj.count}
                    </span>
                </div>`);
            }
        });

        if (invalidateRelatedLines && invalidateRelatedLines.length > 0) {
            bodyHTML = `
                <div class="Prompt-bodyQuery">
                    ${TemplatesStrings.get('deleteResource.USED_BY', 'job template')}
                    ${TemplatesStrings.get('deleteResource.CONFIRM', 'job template')}
                </div>`;
            invalidateRelatedLines.forEach(invalidateRelatedLine => {
                bodyHTML += invalidateRelatedLine;
            });
        }

        return bodyHTML;
    }

    function buildWorkflowCopyPromptBodyHTML ({ templates, inventories, credentials }) {
        let itemsHTML = '';

        if (templates.length > 0) {
            itemsHTML += '<div>Unified Job Templates that cannot be copied<ul>';
            _.forOwn(templates, ujt => {
                if (ujt) {
                    itemsHTML += `<li>'${ujt}</li>`;
                }
            });
            itemsHTML += '</ul></div>';
        }

        if (inventories.length > 0) {
            itemsHTML += '<div>Node prompted inventories that cannot be copied<ul>';
            _.forOwn(inventories, inv => {
                if (inv) {
                    itemsHTML += `<li>'${inv}</li>`;
                }
            });
            itemsHTML += '</ul></div>';
        }

        if (credentials.length > 0) {
            itemsHTML += '<div>Node prompted credentials that cannot be copied<ul>';
            _.forOwn(credentials, cred => {
                if (cred) {
                    itemsHTML += `<li>'${cred}</li>`;
                }
            });
            itemsHTML += '</ul></div>';
        }

        const bodyHTML = `
            <div class="Prompt-bodyQuery">
                You do not have access to all resources used by this workflow.
                Resources that you don't have access to will not be copied
                and will result in an incomplete workflow.
            </div>
            <div class="Prompt-bodyTarget">
                ${itemsHTML}
            </div>
        `;

        return bodyHTML;
    }
}

TemplatesListController.$inject = [
    '$scope',
    '$rootScope',
    'Alert',
    'TemplateList',
    'Prompt',
    'ProcessErrors',
    'GetBasePath',
    'InitiatePlaybookRun',
    'Wait',
    '$state',
    '$filter',
    'Dataset',
    'rbacUiControlService',
    'TemplatesService',
    'QuerySet',
    'TemplateCopyService',
    'i18n',
    'JobTemplateModel',
    'TemplatesStrings'
];

export default TemplatesListController;
