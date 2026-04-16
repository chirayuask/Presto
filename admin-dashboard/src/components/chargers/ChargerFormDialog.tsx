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
import { useStations } from '@/hooks/useStations';
import { useCreateCharger, useUpdateCharger } from '@/hooks/useChargers';
import type { Charger } from '@/types/api';

const schema = z.object({
  stationId: z.string().uuid(),
  serialNumber: z.string().min(1, 'Required'),
  label: z.string().optional(),
  connectorType: z.string().optional(),
  powerKw: z.coerce.number().positive().optional().or(z.literal('').transform(() => undefined)),
});

type FormValues = z.infer<typeof schema>;

export const ChargerFormDialog = ({
  open,
  onOpenChange,
  initial,
  defaultStationId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Charger | null;
  defaultStationId?: string;
}) => {
  const isEdit = !!initial;
  const stations = useStations();
  const create = useCreateCharger();
  const update = useUpdateCharger();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      stationId: defaultStationId ?? '',
      serialNumber: '',
      label: '',
      connectorType: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        stationId: initial?.stationId ?? defaultStationId ?? '',
        serialNumber: initial?.serialNumber ?? '',
        label: initial?.label ?? '',
        connectorType: initial?.connectorType ?? '',
        powerKw: initial?.powerKw ?? undefined,
      });
    }
  }, [open, initial, defaultStationId, form]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      powerKw: values.powerKw === undefined ? null : values.powerKw,
      label: values.label || null,
      connectorType: values.connectorType || null,
    };
    try {
      if (isEdit) {
        await update.mutateAsync({ id: initial!.id, body: payload });
        toast.success('Charger updated');
      } else {
        await create.mutateAsync(payload);
        toast.success('Charger created');
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
          <DialogTitle>{isEdit ? 'Edit charger' : 'New charger'}</DialogTitle>
          <DialogDescription>
            Each charger can have its own TOU pricing schedule.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Station</Label>
            <Select
              value={form.watch('stationId')}
              onValueChange={(v) => form.setValue('stationId', v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select station" />
              </SelectTrigger>
              <SelectContent>
                {stations.data?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} <span className="ml-2 text-muted-foreground">{s.timezone}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.stationId && (
              <p className="text-xs text-destructive">{form.formState.errors.stationId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="serialNumber">Serial number</Label>
              <Input id="serialNumber" {...form.register('serialNumber')} placeholder="BKC-01" />
              {form.formState.errors.serialNumber && (
                <p className="text-xs text-destructive">{form.formState.errors.serialNumber.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="label">Label</Label>
              <Input id="label" {...form.register('label')} placeholder="Bay 1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="connectorType">Connector</Label>
              <Input id="connectorType" {...form.register('connectorType')} placeholder="CCS2 / CHAdeMO" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="powerKw">Power (kW)</Label>
              <Input id="powerKw" type="number" step="0.1" {...form.register('powerKw')} placeholder="150" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create charger'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
