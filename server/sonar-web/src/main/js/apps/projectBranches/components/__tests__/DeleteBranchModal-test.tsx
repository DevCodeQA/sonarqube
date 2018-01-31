/*
 * SonarQube
 * Copyright (C) 2009-2018 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
/* eslint-disable import/first */
jest.mock('../../../../api/branches', () => ({ deleteBranch: jest.fn() }));

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import DeleteBranchModal from '../DeleteBranchModal';
import { ShortLivingBranch, BranchType, BranchLike, PullRequest } from '../../../../app/types';
import { submit, doAsync, click } from '../../../../helpers/testUtils';
import { deleteBranch } from '../../../../api/branches';

const branch: ShortLivingBranch = {
  isMain: false,
  name: 'feature',
  mergeBranch: 'master',
  type: BranchType.SHORT
};

beforeEach(() => {
  (deleteBranch as jest.Mock<any>).mockClear();
});

it('renders', () => {
  const wrapper = shallowRender(branch);
  expect(wrapper).toMatchSnapshot();
  wrapper.setState({ loading: true });
  expect(wrapper).toMatchSnapshot();
});

it('deletes branch', () => {
  (deleteBranch as jest.Mock<any>).mockImplementation(() => Promise.resolve());
  const onDelete = jest.fn();
  const wrapper = shallowRender(branch, onDelete);

  submitForm(wrapper);

  return doAsync().then(() => {
    wrapper.update();
    expect(wrapper.state().loading).toBe(false);
    expect(onDelete).toBeCalled();
    expect(deleteBranch).toBeCalledWith({ branch: 'feature', project: 'foo' });
  });
});

it('deletes pull request', () => {
  (deleteBranch as jest.Mock<any>).mockImplementation(() => Promise.resolve());
  const pullRequest: PullRequest = {
    base: 'master',
    branch: 'feature',
    id: '1234',
    name: 'Feature PR'
  };
  const onDelete = jest.fn();
  const wrapper = shallowRender(pullRequest, onDelete);

  submitForm(wrapper);

  return doAsync().then(() => {
    wrapper.update();
    expect(wrapper.state().loading).toBe(false);
    expect(onDelete).toBeCalled();
    expect(deleteBranch).toBeCalledWith({ project: 'foo', pullRequest: '1234' });
  });
});

it('cancels', () => {
  const onClose = jest.fn();
  const wrapper = shallowRender(branch, jest.fn(), onClose);

  click(wrapper.find('a'));

  return doAsync().then(() => {
    expect(onClose).toBeCalled();
  });
});

it('stops loading on WS error', () => {
  (deleteBranch as jest.Mock<any>).mockImplementation(() => Promise.reject(null));
  const onDelete = jest.fn();
  const wrapper = shallowRender(branch, onDelete);

  submitForm(wrapper);

  return doAsync().then(() => {
    wrapper.update();
    expect(wrapper.state().loading).toBe(false);
    expect(onDelete).not.toBeCalled();
    expect(deleteBranch).toBeCalledWith({ branch: 'feature', project: 'foo' });
  });
});

function shallowRender(
  branchLike: BranchLike,
  onDelete: () => void = jest.fn(),
  onClose: () => void = jest.fn()
) {
  const wrapper = shallow(
    <DeleteBranchModal
      branchLike={branchLike}
      component="foo"
      onClose={onClose}
      onDelete={onDelete}
    />
  );
  (wrapper.instance() as any).mounted = true;
  return wrapper;
}

function submitForm(wrapper: ShallowWrapper<any, any>) {
  submit(wrapper.find('form'));
  expect(wrapper.state().loading).toBe(true);
}
