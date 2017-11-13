function AddCredentialsController (models, $state, $scope, strings) {
    const vm = this || {};

    const { me, credential, credentialType, organization } = models;

    vm.mode = 'add';
    vm.strings = strings;
    vm.panelTitle = strings.get('add.PANEL_TITLE');

    vm.tab = {
        details: { _active: true },
        permissions: { _disabled: true }
    };

    vm.form = credential.createFormSchema('post', {
        omit: ['user', 'team', 'inputs']
    });

    vm.form.disabled = !credential.isCreatable();

    vm.form.organization._resource = 'organization';
    vm.form.organization._route = 'credentials.add.organization';
    vm.form.organization._model = organization;
    vm.form.organization._placeholder = strings.get('inputs.ORGANIZATION_PLACEHOLDER');

    vm.form.credential_type._resource = 'credential_type';
    vm.form.credential_type._route = 'credentials.add.credentialType';
    vm.form.credential_type._model = credentialType;
    vm.form.credential_type._placeholder = strings.get('inputs.CREDENTIAL_TYPE_PLACEHOLDER');

    const gceFileInputSchema = {
        id: 'gce_service_account_key',
        type: 'file',
        label: 'Service Account Key JSON File',
        help_text: 'help text'
    };

    const gceFileInputMapping = {
        project_id: 'project',
        client_email: 'username',
        private_key: 'ssh_key_data'
    };

    const createDefaultGCEInputGroup = () => ({ [gceFileInputSchema.id]: {} });
    const gceIsSelected = () => credentialType.get('name') === 'Google Compute Engine';
    const getGCEFileInputValue = () => vm.gceInputGroup[gceFileInputSchema.id]._value;

    vm.gceInputGroup = createDefaultGCEInputGroup();

    vm.form.inputs = {
        _get: () => {
            credentialType.mergeInputProperties();

            const fields = credentialType.get('inputs.fields');

            if (gceIsSelected()) {
                fields.splice(2, 0, gceFileInputSchema);
                $scope.$watch(getGCEFileInputValue, vm.onGCEFileInputChanged);
            }
            return fields;
        },
        _onUpdate: group => {
            const gceInputGroup = createDefaultGCEInputGroup();

            if (gceIsSelected()) {
                group.forEach(input => { gceInputGroup[input.id] = input; });
            }
            vm.gceInputGroup = gceInputGroup;
        },
        _source: vm.form.credential_type,
        _reference: 'vm.form.inputs',
        _key: 'inputs'
    };

    vm.form.save = data => {
        data.user = me.get('id');

        delete data.inputs[gceFileInputSchema.id];

        console.log(data);

        return credential.request('post', { data });
    };

    vm.form.onSaveSuccess = res => {
        $state.go('credentials.edit', { credential_id: res.data.id }, { reload: true });
    };

    vm.onGCEFileInputChanged = value => {
        if (!value) {
            // vm.unsetGCEFileInput();
            return;
        }

        const { obj, error } = vm.parseGCEFile(value);

        if (error) {
            vm.setInvalidGCEFileInput('invalid');
            return;
        }

        if (!vm.gceFileHasRequiredFields(obj)) {
            vm.setInvalidGCEFileInput('missing');
            return;
        }

        vm.setGCEFileInput(obj);
    };

    vm.gceFileHasRequiredFields = obj => Object.keys(gceFileInputMapping)
        .filter(key => vm.gceInputGroup[gceFileInputMapping[key]].required)
        .every(key => Object.prototype.hasOwnProperty.call(obj, key));

    vm.setGCEFileInput = obj => {
        console.log(obj);
        vm.gceInputGroup.project._disabled = true;
        vm.gceInputGroup.username._disabled = true;
        vm.gceInputGroup.ssh_key_data._disabled = true;

        vm.gceInputGroup.project._value = obj.project_id;
        vm.gceInputGroup.username._value = obj.client_email;
        vm.gceInputGroup.ssh_key_data._value = obj.private_key;

        vm.gceInputGroup[gceFileInputSchema.id]._isValid = true;
        vm.gceInputGroup[gceFileInputSchema.id]._rejected = false;
        vm.gceInputGroup[gceFileInputSchema.id]._message = '';
    };

    vm.setInvalidGCEFileInput = message => {
        vm.gceInputGroup.project._disabled = true;
        vm.gceInputGroup.username._disabled = true;
        vm.gceInputGroup.ssh_key_data._disabled = true;

        vm.gceInputGroup.project._value = '';
        vm.gceInputGroup.username._value = '';
        vm.gceInputGroup.ssh_key_data._value = '';

        vm.gceInputGroup[gceFileInputSchema.id]._isValid = false;
        vm.gceInputGroup[gceFileInputSchema.id]._rejected = true;
        vm.gceInputGroup[gceFileInputSchema.id]._message = message;
    };

    vm.unsetGCEFileInput = () => {
        vm.gceInputGroup.project._value = '';
        vm.gceInputGroup.username._value = '';
        vm.gceInputGroup.ssh_key_data._value = '';

        vm.gceInputGroup[gceFileInputSchema.id]._isValid = true;
        vm.gceInputGroup[gceFileInputSchema.id]._rejected = false;
        vm.gceInputGroup[gceFileInputSchema.id]._message = '';

        vm.gceInputGroup.project._disabled = false;
        vm.gceInputGroup.username._disabled = false;
        vm.gceInputGroup.ssh_key_data._disabled = false;
    };

    vm.parseGCEFile = value => {
        let obj;
        let error;

        try {
            obj = angular.fromJson(value);
        } catch (err) {
            error = err;
        }

        return { obj, error };
    };
}

AddCredentialsController.$inject = [
    'resolvedModels',
    '$state',
    '$scope',
    'CredentialsStrings'
];

export default AddCredentialsController;
