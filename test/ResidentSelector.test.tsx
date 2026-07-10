import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResidentSelector, type ResidentSelectorResident } from '../src/ui';

const allowed: ResidentSelectorResident = {
  residentId: '00123',
  displayName: '利用者1',
  kana: 'りようしゃいち',
  room: '201',
  episode: 'E-12',
  status: '入所中',
  createAllowed: true,
  episodeOpen: true,
};

describe('ResidentSelector', () => {
  it('create mode only shows candidates explicitly allowed by both server decisions', () => {
    render(
      <ResidentSelector
        mode="create"
        data={{
          residents: [
            { ...allowed, createAllowed: false, displayName: '作成不可' },
            { ...allowed, episodeOpen: false, displayName: '終了済み' },
            allowed,
          ],
        }}
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByRole('option', { name: /利用者1/ })).toBeInTheDocument();
    expect(screen.queryByText('作成不可')).not.toBeInTheDocument();
    expect(screen.queryByText('終了済み')).not.toBeInTheDocument();
    expect(screen.getByText('ID 00123')).toBeInTheDocument();
  });

  it('renders only supplied search tabs and preserves resident order while filtering', () => {
    render(
      <ResidentSelector
        mode="search"
        data={{
          tabs: [
            {
              id: 'current',
              label: '現在',
              residents: [
                { ...allowed, residentId: '00002', displayName: '利用者2' },
                { ...allowed, residentId: '00001', displayName: '利用者1' },
              ],
            },
            {
              id: 'past',
              label: '過去',
              residents: [{ ...allowed, residentId: '00003', displayName: '利用者3' }],
            },
          ],
        }}
        onSelect={() => undefined}
      />,
    );

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('利用者2');
    expect(options[1]).toHaveTextContent('利用者1');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '00001' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option')).toHaveTextContent('利用者1');

    fireEvent.click(screen.getByRole('tab', { name: '過去' }));
    expect(screen.queryByText('利用者3')).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    expect(screen.getByRole('option')).toHaveTextContent('利用者3');
  });

  it('loads through the prop loader, hides raw errors, and retries fail-closed', async () => {
    const loadData = vi
      .fn()
      .mockRejectedValueOnce(new Error('secret upstream detail'))
      .mockResolvedValueOnce({ residents: [allowed] });

    render(<ResidentSelector mode="create" loadData={loadData} onSelect={() => undefined} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('利用者一覧を読み込めませんでした。');
    expect(screen.queryByText('secret upstream detail')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: '再試行' }));
    expect(await screen.findByRole('option', { name: /利用者1/ })).toBeInTheDocument();
    expect(loadData).toHaveBeenCalledTimes(2);
  });

  it('supports clear selection and keyboard selection of the first ordered result', async () => {
    const onSelect = vi.fn();
    const onClear = vi.fn();
    render(
      <ResidentSelector
        mode="create"
        data={{ residents: [allowed] }}
        value={allowed}
        onSelect={onSelect}
        onClear={onClear}
      />,
    );

    const selected = screen.getByLabelText('選択中の利用者');
    fireEvent.click(within(selected).getByRole('button', { name: /選択を解除/ }));
    expect(onClear).toHaveBeenCalledOnce();

    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' });
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(allowed));
  });
});
