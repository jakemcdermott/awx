import {
    getInventorySource,
    getJobTemplate,
    getProject,
    getWorkflowTemplate
} from '../fixtures';

const data = {};

module.exports = {
    before: (client, done) => {
        const resources = [
            getInventorySource('test-actions').then(obj => { data.inventorySource = obj; }),
            getJobTemplate('test-actions').then(obj => { data.jobTemplate = obj; }),
            getProject('test-actions').then(obj => { data.project = obj; }),
            getWorkflowTemplate('test-actions').then(obj => { data.workflowTemplate = obj; })
        ];

        Promise.all(resources).then(done);
    },
    'copy job template': client => {
        const templates = client.page.templates();

        client.useCss();
        client.resizeWindow(1200, 800);
        client.login();
        client.waitForAngular();

        templates.navigate();
        templates.waitForElementVisible('div.spinny');
        templates.waitForElementNotVisible('div.spinny');

        templates.section.list.expect.element('smart-search').visible;
        templates.section.list.section.search.expect.element('@input').enabled;

        templates.section.list.section.search
            .sendKeys('@input', `id:>${data.jobTemplate.id - 1} id:<${data.jobTemplate.id + 1}`)
            .sendKeys('@input', client.Keys.ENTER);

        templates.waitForElementVisible('div.spinny');
        templates.waitForElementNotVisible('div.spinny');

        templates.section.list.expect.element('@badge').text.equal('1');
        templates.expect.element(`#templates_table tr[id="${data.jobTemplate.id}"]`).visible;
        templates.expect.element('i[class*="copy"]').visible;
        templates.expect.element('i[class*="copy"]').enabled;

        templates.click('i[class*="copy"]');
        templates.waitForElementVisible('div.spinny');
        templates.waitForElementNotVisible('div.spinny');

        templates.expect.element('#job_template_form').visible;
        templates.section.addJobTemplate.expect.element('@title').visible;
        templates.section.addJobTemplate.expect.element('@title').text.contain(data.jobTemplate.name);
        templates.section.addJobTemplate.expect.element('@title').text.not.equal(data.jobTemplate.name);
        templates.expect.element('@save').visible;
        templates.expect.element('@save').enabled;

        client.end();
    },
    'copy workflow template': client => {
        const templates = client.page.templates();

        client.useCss();
        client.resizeWindow(1200, 800);
        client.login();
        client.waitForAngular();

        templates.navigate();
        templates.waitForElementVisible('div.spinny');
        templates.waitForElementNotVisible('div.spinny');

        templates.section.list.expect.element('smart-search').visible;
        templates.section.list.section.search.expect.element('@input').enabled;

        templates.section.list.section.search
            .sendKeys('@input', `id:>${data.workflowTemplate.id - 1} id:<${data.workflowTemplate.id + 1}`)
            .sendKeys('@input', client.Keys.ENTER);

        templates.waitForElementVisible('div.spinny');
        templates.waitForElementNotVisible('div.spinny');

        templates.section.list.expect.element('@badge').text.equal('1');
        templates.expect.element(`#templates_table tr[id="${data.workflowTemplate.id}"]`).visible;
        templates.expect.element('i[class*="copy"]').visible;
        templates.expect.element('i[class*="copy"]').enabled;

        templates
            .click('i[class*="copy"]')
            .waitForElementVisible('div.spinny')
            .waitForElementNotVisible('div.spinny')
            .waitForAngular();

        templates.expect.element('#workflow_job_template_form').visible;
        templates.section.editWorkflowJobTemplate.expect.element('@title').visible;
        templates.section.editWorkflowJobTemplate.expect.element('@title').text.contain(data.workflowTemplate.name);
        templates.section.editWorkflowJobTemplate.expect.element('@title').text.not.equal(data.workflowTemplate.name);

        templates.expect.element('@save').visible;
        templates.expect.element('@save').enabled;

        client
            .useXpath()
            .waitForElementVisible('//*[text()=" Workflow Editor"]')
            .click('//*[text()=" Workflow Editor"]')
            .useCss()
            .waitForElementVisible('div.spinny')
            .waitForElementNotVisible('div.spinny')
            .waitForAngular();

        client.expect.element('#workflow-modal-dialog').visible;
        client.expect.element('#workflow-modal-dialog span[class^="badge"]').visible;
        client.expect.element('#workflow-modal-dialog span[class^="badge"]').text.equal('3');
        client.expect.element('div[class="WorkflowMaker-title"]').visible;
        client.expect.element('div[class="WorkflowMaker-title"]').text.contain(data.workflowTemplate.name);
        client.expect.element('div[class="WorkflowMaker-title"]').text.not.equal(data.workflowTemplate.name);

        client.expect.element('#workflow-modal-dialog i[class*="fa-cog"]').visible;
        client.expect.element('#workflow-modal-dialog i[class*="fa-cog"]').enabled;

        client.click('#workflow-modal-dialog i[class*="fa-cog"]');

        client.waitForElementVisible('workflow-controls');
        client.waitForElementVisible('div[class*="-zoomPercentage"]');

        client.expect.element('div[class*="-zoomPercentage"]').text.equal('100%');
        client.click('i[class*="fa-minus"]').expect.element('div[class*="-zoomPercentage"]').text.equal('90%');
        client.click('i[class*="fa-minus"]').expect.element('div[class*="-zoomPercentage"]').text.equal('80%');
        client.click('i[class*="fa-minus"]').expect.element('div[class*="-zoomPercentage"]').text.equal('70%');
        client.click('i[class*="fa-minus"]').expect.element('div[class*="-zoomPercentage"]').text.equal('60%');

        client.expect.element('#node-1').visible;
        client.expect.element('#node-2').visible;
        client.expect.element('#node-3').visible;
        client.expect.element('#node-4').visible;

        client.expect.element('#node-1 text').text.not.equal('').after(5000);
        client.expect.element('#node-2 text').text.not.equal('').after(5000);
        client.expect.element('#node-3 text').text.not.equal('').after(5000);
        client.expect.element('#node-4 text').text.not.equal('').after(5000);

        const checkNodeText = (selector, text) => client.getText(selector, ({ value }) => {
            client.assert.equal(text.indexOf(value.replace('...', '')) >= 0, true);
        });

        checkNodeText('#node-1 text', 'START');
        checkNodeText('#node-2 text', data.project.name);
        checkNodeText('#node-3 text', data.jobTemplate.name);
        checkNodeText('#node-4 text', data.inventorySource.name);

        templates.expect.element('@save').visible;
        templates.expect.element('@save').enabled;

        client.end();
    }
};
