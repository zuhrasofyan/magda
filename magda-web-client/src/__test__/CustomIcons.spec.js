import React from 'react';
import renderer from 'react-test-renderer';
import CustomIcons from '../UI/CustomIcons';

it('renders default icon', () => {
  const tree = renderer.create(
    <CustomIcons/>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});


it('renders jpeg icon', () => {
  const tree = renderer.create(
    <CustomIcons name='JPG' className='test'/>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});


it('renders custom url icon', () => {
  const tree = renderer.create(
    <CustomIcons imageUrl='http://lorempixel.com/400/200/'/>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
