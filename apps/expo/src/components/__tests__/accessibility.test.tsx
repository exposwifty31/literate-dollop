/**
 * Accessibility attribute tests for the VetTrack component library.
 * Verifies roles, states, and labels are present so screen readers
 * (VoiceOver / TalkBack) can announce components correctly.
 */
import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Badge } from '../Badge';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { FormField } from '../FormField';
import { ListItem } from '../ListItem';
import { StatusBadge } from '../StatusBadge';

describe('Button accessibility', () => {
  it('has accessibilityRole="button"', () => {
    render(<Button label="Confirm" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeTruthy();
  });

  it('exposes accessibilityLabel equal to the label prop', () => {
    render(<Button label="Save shift" onPress={jest.fn()} />);
    const btn = screen.getByRole('button', { name: 'Save shift' });
    expect(btn).toBeTruthy();
  });

  it('sets accessibilityState.disabled when isDisabled=true', () => {
    render(<Button label="Delete" onPress={jest.fn()} isDisabled />);
    const btn = screen.getByRole('button', { name: 'Delete' });
    expect(btn.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('sets accessibilityState.busy when isLoading=true', () => {
    render(<Button label="Saving…" onPress={jest.fn()} isLoading />);
    const btn = screen.getByRole('button', { name: 'Saving…' });
    expect(btn.props.accessibilityState).toMatchObject({ busy: true });
  });

  it('is not pressable when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Delete" onPress={onPress} isDisabled />);
    fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Chip accessibility', () => {
  it('has accessibilityRole="button"', () => {
    render(<Chip label="All" selected={false} onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'All' })).toBeTruthy();
  });

  it('sets accessibilityState.selected=true when selected', () => {
    render(<Chip label="OK" selected onPress={jest.fn()} />);
    const chip = screen.getByRole('button', { name: 'OK' });
    expect(chip.props.accessibilityState).toMatchObject({ selected: true });
  });

  it('sets accessibilityState.selected=false when not selected', () => {
    render(<Chip label="Issue" selected={false} onPress={jest.fn()} />);
    const chip = screen.getByRole('button', { name: 'Issue' });
    expect(chip.props.accessibilityState).toMatchObject({ selected: false });
  });
});

describe('FormField accessibility', () => {
  it('input has accessibilityLabel matching the label prop', () => {
    render(<FormField label="Patient name" />);
    expect(screen.getByLabelText('Patient name')).toBeTruthy();
  });

  it('shows error text with accessibilityRole="alert"', () => {
    render(<FormField label="Email" error="Invalid email address" />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeTruthy();
    expect(screen.getByText('Invalid email address')).toBeTruthy();
  });

  it('shows required asterisk when required=true', () => {
    render(<FormField label="Email" required />);
    expect(screen.getByText(' *')).toBeTruthy();
  });

  it('does not show error element when error is undefined', () => {
    render(<FormField label="Notes" />);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('ListItem accessibility', () => {
  it('interactive variant has accessibilityRole="button"', () => {
    render(<ListItem title="ICU" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'ICU' })).toBeTruthy();
  });

  it('uses accessibilityLabel prop over title when provided', () => {
    render(
      <ListItem
        title="room-3"
        accessibilityLabel="Operating Theatre"
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Operating Theatre' })).toBeTruthy();
  });

  it('non-interactive variant renders without a button role', () => {
    render(<ListItem title="Static row" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Static row')).toBeTruthy();
  });
});

describe('Badge accessibility', () => {
  it('renders visible text (not colour-only status)', () => {
    render(<Badge label="OK" variant="ok" />);
    expect(screen.getByText('OK')).toBeTruthy();
  });

  it('has accessibilityRole="text"', () => {
    render(<Badge label="Critical" variant="critical" />);
    expect(screen.getByRole('text')).toBeTruthy();
  });
});

describe('StatusBadge accessibility', () => {
  it('renders a visible text label for each status', () => {
    const statuses = ['ok', 'issue', 'critical', 'maintenance', 'sterilized'] as const;
    for (const status of statuses) {
      const { unmount } = render(
        <StatusBadge status={status} label={`Status: ${status}`} />,
      );
      expect(screen.getByText(`Status: ${status}`)).toBeTruthy();
      unmount();
    }
  });
});
