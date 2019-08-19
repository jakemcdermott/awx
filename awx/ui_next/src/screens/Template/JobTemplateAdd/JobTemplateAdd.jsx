import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { withI18n } from '@lingui/react';
import { t } from '@lingui/macro';
import {
  Card,
  CardBody,
  CardHeader,
  PageSection,
  Tooltip,
} from '@patternfly/react-core';
import CardCloseButton from '@components/CardCloseButton';
import JobTemplateForm from '../shared/JobTemplateForm';
import { JobTemplatesAPI } from '@api';

function JobTemplateAdd({ history, i18n }) {
  const [error, setError] = useState(null);

  const handleSubmit = async (values, newLabels=[]) => {
    setError(null);
    try {
      const { data } = await JobTemplatesAPI.create(values);
      await Promise.all([submitLabels(data, newLabels)]);
      history.push(`/templates/${data.type}/${data.id}/details`);
    } catch (err) {
      setError(err);
    }
  };
  const submitLabels = async (template, newLabels) => {
    const associationPromises = newLabels
    .filter(label => label.id)
    .map(label => {
      const labelObject = {
        associate: true, id: label.id
      }
      return JobTemplatesAPI.associateLabel(template.id, labelObject)
    });
  const creationPromises = newLabels
    .filter(label => !label.id)
    .map(label => {
      const labelObject = {
        name: label, organization:
          template.summary_fields.inventory.organization_id
      }
      return JobTemplatesAPI.generateLabel(template.id, labelObject)
    });
    const results = await Promise.all([
      ...associationPromises,
      ...creationPromises,
    ]);
    return results;
  }

  const handleCancel = () => {
    history.push(`/templates`);
  };

  return (
    <PageSection>
      <Card>
        <CardHeader className="at-u-textRight">
          <Tooltip content={i18n._(t`Close`)} position="top">
            <CardCloseButton onClick={handleCancel} />
          </Tooltip>
        </CardHeader>
        <CardBody>
          <JobTemplateForm
            handleCancel={handleCancel}
            handleSubmit={handleSubmit}
          />
        </CardBody>
        {error ? <div>error</div> : ''}
      </Card>
    </PageSection>
  );
}

export default withI18n()(withRouter(JobTemplateAdd));
