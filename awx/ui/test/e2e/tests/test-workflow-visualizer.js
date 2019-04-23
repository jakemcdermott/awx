import {
    getInventorySource,
    getJobTemplate,
    getProject,
    getWorkflowTemplate
} from '../fixtures';

import {
    AWX_E2E_URL,
    AWX_E2E_TIMEOUT_LONG
} from '../settings';

let data;
const spinny = "//*[contains(@class, 'spinny')]";
const workflowSelector = "//a[text()='test-actions-workflow-template']";
const workflowVisualizerBtn = "//button[contains(@id, 'workflow_job_template_workflow_visualizer_btn')]";
const workflowSearchBar = "//input[contains(@class, 'SmartSearch-input')]";
const workflowText = 'name.iexact:"test-actions-workflow-template"';

const startNodeId = '1';
let initialJobNodeId;
let initialProjectNodeId;
let initialInventoryNodeId;
let newChildNodeId;
let leafNodeId;
const nodeAdd = "//*[contains(@class, 'WorkflowChart-nodeAddIcon')]";
const nodeRemove = "//*[contains(@class, 'WorkflowChart-nodeRemoveIcon')]";

// one of the jobs or projects or inventories
const testActionsJob = "//div[contains(@class, 'List-tableCell') and contains(text(), 'test-actions-job')]";
const testActionsJobText = 'name.iexact:"test-actions-job-template"';

// search bar for visualizer templates
const jobSearchBar = "//*[contains(@id, 'workflow-jobs-list')]//input[contains(@class, 'SmartSearch-input')]";

// dropdown bar which lets you select edge type
const edgeTypeDropdownBar = "//span[contains(@id, 'select2-workflow_node_edge-container')]";
const alwaysDropdown = "//li[contains(@id, 'select2-workflow_node_edge') and text()='Always']";
const successDropdown = "//li[contains(@id, 'select2-workflow_node_edge') and text()='On Success']";
const failureDropdown = "//li[contains(@id, 'select2-workflow_node_edge') and text()='On Failure']";
const linkEdgeTypeDropdownBar = "//span[contains(@id, 'select2-workflow_link_edge-container')]";
const linkAlwaysDropdown = "//li[contains(@id, 'select2-workflow_link_edge') and text()='Always']";
const linkSuccessDropdown = "//li[contains(@id, 'select2-workflow_link_edge') and text()='On Success']";
const linkFailureDropdown = "//li[contains(@id, 'select2-workflow_link_edge') and text()='On Failure']";
const nodeSelectButton = "//*[@id='workflow_maker_select_node_btn']";
const linkSelectButton = "//*[@id='workflow_maker_select_link_btn']";
const nodeCancelButton = "//*[@id='workflow_maker_cancel_node_btn']";
const deleteConfirmation = "//button[@ng-click='confirmDeleteNode()']";

const xPathNodeById = (id) => `//*[@id='node-${id}']`;
const xPathLinkById = (sourceId, targetId) => `//*[@id='link-${sourceId}-${targetId}']//*[contains(@class, 'WorkflowChart-linkPath')]`;
const xPathNodeByName = (name) => `//*[contains(@class, "WorkflowChart-nameText") and contains(text(), "${name}")]/..`

module.exports = {
    before: (client, done) => {
        const resources = [
            getInventorySource('test-actions'),
            getJobTemplate('test-actions'),
            getProject('test-actions'),
            getWorkflowTemplate('test-actions'),
        ];

        Promise.all(resources)
            .then(([source, template, project, workflow]) => {
                data = { source, template, project, workflow };
                client
                    .login()
                    .waitForAngular()
                    .resizeWindow(1200, 1000)
                    .navigateTo(`${AWX_E2E_URL}/#/templates`, false)
                    .useXpath()
                    .waitForElementVisible(workflowSearchBar)
                    .setValue(workflowSearchBar, [workflowText])
                    .click('//*[contains(@class, "SmartSearch-searchButton")]')
                    .waitForSpinny(true)
                    .click('//*[contains(@class, "SmartSearch-clearAll")]')
                    .waitForSpinny(true)
                    .setValue(workflowSearchBar, [workflowText])
                    .click('//*[contains(@class, "SmartSearch-searchButton")]')
                    .waitForSpinny(true)
                    .click(workflowSelector)
                    .waitForElementVisible(workflowVisualizerBtn)
                    .click(workflowVisualizerBtn)
                    .waitForSpinny(true);
                client.waitForElementVisible(xPathNodeByName('test-actions-job'));
                // Grab the ids of the nodes
                client.getAttribute(xPathNodeByName('test-actions-job'), 'id', (res) => {
                    initialJobNodeId = res.value.split('-')[1];
                });
                client.getAttribute(xPathNodeByName('test-actions-project'), 'id', (res) => {
                    initialProjectNodeId = res.value.split('-')[1];
                });
                client.getAttribute(xPathNodeByName('test-actions-inventory'), 'id', (res) => {
                    initialInventoryNodeId = res.value.split('-')[1];
                });
                done();
            });
    },
    'verify that workflow visualizer new root node can only be set to always': client => {
        client
            .useXpath()
            .findThenClick(xPathNodeById(startNodeId))
            .waitForElementPresent(edgeTypeDropdownBar)
            .findThenClick(edgeTypeDropdownBar)
            .waitForElementNotPresent(successDropdown)
            .waitForElementNotPresent(failureDropdown)
            .waitForElementPresent(alwaysDropdown)
            .click(nodeCancelButton)
            // Make sure that the animation finishes before moving on to the next test
            .pause(500);
    },
    'verify that a link can be changed': client => {
        client
            .useXpath()
            .moveToElement(xPathLinkById(initialJobNodeId, initialInventoryNodeId), 20, 0, () => {
                client.waitForElementNotVisible(spinny);
                client.mouseButtonClick(0);
            })
            .waitForElementPresent(linkEdgeTypeDropdownBar)
            .findThenClick(linkEdgeTypeDropdownBar)
            .waitForElementPresent(linkSuccessDropdown)
            .waitForElementPresent(linkFailureDropdown)
            .waitForElementPresent(linkAlwaysDropdown)
            .findThenClick(linkSuccessDropdown)
            .click(linkSelectButton);
    },
    'verify that a new sibling node can be any edge type': client => {
        client
            .useXpath()
            .moveToElement(xPathNodeById(initialJobNodeId), 0, 0, () => {
                client.pause(500);
                client.waitForElementNotVisible(spinny);
                // Concatenating the xpaths lets us click the proper node
                client.click(xPathNodeById(initialJobNodeId) + nodeAdd);
            })
            .pause(1000)
            .waitForElementNotVisible(spinny);

        // Grab the id of the new child node for later
        client.getAttribute('//*[contains(@class, "WorkflowChart-isNodeBeingAdded")]/..', 'id', (res) => {
            newChildNodeId = res.value.split('-')[1];
        });

        client
            .waitForElementVisible(jobSearchBar)
            .clearValue(jobSearchBar)
            .setValue(jobSearchBar, [testActionsJobText, client.Keys.ENTER])
            .pause(1000)
            .findThenClick(testActionsJob)
            .pause(1000)
            .waitForElementNotVisible(spinny)
            .findThenClick(edgeTypeDropdownBar)
            .waitForElementPresent(successDropdown)
            .waitForElementPresent(failureDropdown)
            .waitForElementPresent(alwaysDropdown)
            .findThenClick(alwaysDropdown)
            .click(nodeSelectButton);
    },
    'Verify node-shifting behavior upon deletion': client => {
        client
            .moveToElement(xPathNodeById(newChildNodeId), 0, 0, () => {
                client.pause(500);
                client.waitForElementNotVisible(spinny);
                client.click(xPathNodeById(newChildNodeId) + nodeAdd);
            })
            .pause(1000)
            .waitForElementNotVisible(spinny);

        // Grab the id of the new child node for later
        client.getAttribute('//*[contains(@class, "WorkflowChart-isNodeBeingAdded")]/..', 'id', (res) => {
            // I had to nest this logic in order to ensure that leafNodeId was available later on.
            // Separating this out resulted in leafNodeId being `undefined` when sent to
            // xPathLinkById
            leafNodeId = res.value.split('-')[1];
            client
                .waitForElementVisible(jobSearchBar)
                .clearValue(jobSearchBar)
                .setValue(jobSearchBar, [testActionsJobText, client.Keys.ENTER])
                .pause(1000)
                .findThenClick(testActionsJob)
                .pause(1000)
                .waitForElementNotVisible(spinny)
                .findThenClick(edgeTypeDropdownBar)
                .waitForElementPresent(successDropdown)
                .waitForElementPresent(failureDropdown)
                .waitForElementPresent(alwaysDropdown)
                .findThenClick(alwaysDropdown)
                .click(nodeSelectButton)
                .moveToElement(xPathNodeById(newChildNodeId), 0, 0, () => {
                    client.pause(500);
                    client.waitForElementNotVisible(spinny);
                    client.click(xPathNodeById(newChildNodeId) + nodeRemove);
                })
                .pause(1000)
                .waitForElementNotVisible(spinny)
                .findThenClick(deleteConfirmation)
                .waitForElementVisible(xPathLinkById(initialJobNodeId, leafNodeId));
        });
    },
    after: client => {
        client.end();
    }
};
