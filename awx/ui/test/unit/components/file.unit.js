const BROWSE = 'BROWSE';
const REMOVE = 'REMOVE';

describe('Components | Input | File', () => {
    let $scope;
    let element;
    let state;
    let controller;

    const getMockFileEvent = file => ({ target: { files: [file] } });

    beforeEach(() => {
        angular.mock.module('at.lib.services');
        angular.mock.module('at.lib.components');
    });

    describe('AtInputFileController', () => {
        beforeEach(angular.mock.inject(($rootScope, $compile) => {
            const component = '<at-input-file id="unit" state="vm.form.unit"></at-input-file>';
            const dom = angular.element(`<at-form state="vm.form">${component}</at-form>`);

            $scope = $rootScope.$new();
            $scope.vm = { form: { disabled: false, unit: {} } };

            $compile(dom)($scope);
            $scope.$digest();

            element = dom.find('#unit');
            state = $scope.vm.form.unit;
            controller = element.controller('atInputFile');
        }));

        it(`Should be initialzed without a value in "${BROWSE}" mode by default`, () => {
            expect(state._value).not.toBeDefined();
            expect(state._buttonText).toEqual(BROWSE);
        });

        it(`Should enter "${REMOVE}" mode when value is read`, () => {
            const event = getMockFileEvent({ name: 'notavirus.exe' });
            const reader = { result: 'AAAAAAA' };

            controller.readFile(reader, event);

            $scope.$digest();

            expect(state._buttonText).toEqual(REMOVE);
        });

        it('Should notify handler on file input change event', () => {
            controller.handleFileChangeEvent = jasmine.createSpy('handleFileChangeEvent');

            element.find('input')[0].dispatchEvent(new Event('change'));

            $scope.$digest();

            expect(controller.handleFileChangeEvent).toHaveBeenCalled();
        });
    });
});
