function AddContainerGroupController($scope, $state, models, strings, i18n, CredTypesList) {
  const vm = this || {};
  const {
    instanceGroup,
    credential
  } = models;


  vm.mode = 'add'
  vm.strings = strings
  vm.panelTitle = strings.get('state.ADD_CONTAINER_GROUP_BREADCRUMB_LABEL')
  vm.lookUpTitle = strings.get('credential.LOOK_UP_TITLE')
  vm.form = instanceGroup.createFormSchema('post')

  vm.form.credential = {
    type: 'field',
    label: i18n._('Credential'),
    id: 'credential'
  };
  vm.form.credential._placeholder = strings.get('credential.CREDENTIAL_TYPE_PLACEHOLDER')
  vm.form.credential._route = "instanceGroups.addContainerGroup.credentials"
  vm.form.credential._model = credential
  vm.form.credential._resource = 'credential';
  vm.form.credential.required = true
  vm.panelTitle = strings.get('credential.PANEL_TITLE');


  $scope.$watch('credential', () => {
    if ($scope.credential) {
      console.log('watch', $scope.credential)
      vm.form.credential._idFromModal= $scope.credential;
      }
  });
  vm.form.save = (data) => {
    console.log(data, 'save data')
    return instanceGroup.request('post', { data: data });

    // $state.go('instanceGroups.addContainerGroup')
  };
}


AddContainerGroupController.$inject = [
  '$scope',
  '$state',
  'resolvedModels',
  'InstanceGroupsStrings',
  'i18n',
  'CredTypesList'
];

export default AddContainerGroupController;
