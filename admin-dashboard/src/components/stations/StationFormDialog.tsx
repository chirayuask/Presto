import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTimezones } from '@/hooks/useMeta';
import { useCreateStation, useUpdateStation } from '@/hooks/useStations';
import type { Station } from '@/types/api';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  address: z.string().optional(),
  timezone: z.string().min(1, 'Pick a timezone'),
});

type FormValues = z.infer<typeof schema>;

export const StationFormDialog = ({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Station | null;
}) => {
  const isEdit = !!initial;
  const timezones = useTimezones();
  const create = useCreateStation();
  const update = useUpdateStation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', address: '', timezone: 'Asia/Kolkata' },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: initial?.name ?? '',
        address: initial?.address ?? '',
        timezone: initial?.timezone ?? 'Asia/Kolkata',
      });
    }
  }, [open, initial, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await update.mutateAsync({ id: initial!.id, body: values });
        toast.success('Station updated');
      } else {
        await create.mutateAsync(values);
        toast.success('Station created');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit station' : 'New station'}</DialogTitle>
          <DialogDescription>
            Stations group chargers and determine their local timezone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register('name')} placeholder="e.g. Bandra Kurla EV Hub" />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...form.register('address')} placeholder="Street, City" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={form.watch('timezone')}
              onValueChange={(v) => form.setValue('timezone', v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.data?.map((tz) => (
                  <SelectItem key={tz.zone} value={tz.zone}>
                    {tz.zone} <span className="ml-2 text-muted-foreground">{tz.offset}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create station'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
