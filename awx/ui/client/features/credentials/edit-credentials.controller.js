function EditCredentialsController (models, $state, $scope, strings) {
    const vm = this || {};

    const { me, credential, credentialType, organization } = models;

    const omit = ['user', 'team', 'inputs'];
    const isEditable = credential.isEditable();

    vm.mode = 'edit';
    vm.strings = strings;
    vm.panelTitle = credential.get('name');

    vm.tab = {
        details: {
            _active: true,
            _go: 'credentials.edit',
            _params: { credential_id: credential.get('id') }
        },
        permissions: {
            _go: 'credentials.edit.permissions',
            _params: { credential_id: credential.get('id') }
        }
    };

    $scope.$watch('$state.current.name', (value) => {
        if (/credentials.edit($|\.organization$)/.test(value)) {
            vm.tab.details._active = true;
            vm.tab.permissions._active = false;
        } else {
            vm.tab.permissions._active = true;
            vm.tab.details._active = false;
        }
    });

    // Only exists for permissions compatibility
    $scope.credential_obj = credential.get();

    if (isEditable) {
        vm.form = credential.createFormSchema('put', { omit });
    } else {
        vm.form = credential.createFormSchema({ omit });
        vm.form.disabled = !isEditable;
    }

    const isOrgAdmin = _.some(me.get('related.admin_of_organizations.results'), (org) => org.id === organization.get('id'));
    const isSuperuser = me.get('is_superuser');
    const isCurrentAuthor = Boolean(credential.get('summary_fields.created_by.id') === me.get('id'));
    vm.form.organization._disabled = true;
    if (isSuperuser || isOrgAdmin || (credential.get('organization') === null && isCurrentAuthor)) {
        vm.form.organization._disabled = false;
    }

    vm.form.organization._resource = 'organization';
    vm.form.organization._model = organization;
    vm.form.organization._route = 'credentials.edit.organization';
    vm.form.organization._value = credential.get('summary_fields.organization.id');
    vm.form.organization._displayValue = credential.get('summary_fields.organization.name');
    vm.form.organization._placeholder = strings.get('inputs.ORGANIZATION_PLACEHOLDER');

    vm.form.credential_type._resource = 'credential_type';
    vm.form.credential_type._model = credentialType;
    vm.form.credential_type._route = 'credentials.edit.credentialType';
    vm.form.credential_type._value = credentialType.get('id');
    vm.form.credential_type._displayValue = credentialType.get('name');
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

    vm.form.inputs = {
        _get () {
            let fields;

            credentialType.mergeInputProperties();

            if (credentialType.get('id') === credential.get('credential_type')) {
                fields = credential.assignInputGroupValues(credentialType.get('inputs.fields'));
            } else {
                fields = credentialType.get('inputs.fields');
            }

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

    /**
     * If a credential's `credential_type` is changed while editing, the inputs associated with
     * the old type need to be cleared before saving the inputs associated with the new type.
     * Otherwise inputs are merged together making the request invalid.
     */
    vm.form.save = data => {
        data.user = me.get('id');
        credential.unset('inputs');

        delete data.inputs[gceFileInputSchema.id];

        return credential.request('put', { data });
    };

    vm.form.onSaveSuccess = () => {
        $state.go('credentials.edit', { credential_id: credential.get('id') }, { reload: true });
    };

    vm.onGCEFileInputChanged = value => {
        if (!value) {
            vm.unsetGCEFileInput();
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

EditCredentialsController.$inject = [
    'resolvedModels',
    '$state',
    '$scope',
    'CredentialsStrings'
];

export default EditCredentialsController;
