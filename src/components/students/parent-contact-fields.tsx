'use client';

import { useFieldArray, Control } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ParentContact {
  name: string;
  relation: string;
  phone: string;
  email?: string | null;
  address?: string | null;
}

interface ParentContactFieldsProps {
  control: Control<any>;
  errors?: any;
}

/**
 * ParentContactFields Component
 * Dynamic fields for adding/removing parent contacts
 */
export function ParentContactFields({ control, errors }: ParentContactFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'parentContacts',
  });

  const addContact = () => {
    append({
      name: '',
      relation: '',
      phone: '',
      email: '',
      address: '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Kontak Orang Tua</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addContact}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Tambah Kontak
        </Button>
      </div>

      {fields.length === 0 && (
        <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-4 text-center">
          Belum ada kontak orang tua. Klik "Tambah Kontak" untuk menambahkan.
        </div>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="border border-border rounded-lg p-4 space-y-4 relative"
        >
          {fields.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(index)}
              className="absolute top-2 right-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}

          <div className="text-sm font-medium text-muted-foreground mb-2">
            Kontak #{index + 1}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor={`parentContacts.${index}.name`}>
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`parentContacts.${index}.name`}
                {...control.register(`parentContacts.${index}.name`)}
                placeholder="Masukkan nama orang tua"
                className={errors?.parentContacts?.[index]?.name ? 'border-destructive' : ''}
              />
              {errors?.parentContacts?.[index]?.name && (
                <p className="text-sm text-destructive">
                  {errors.parentContacts[index].name.message}
                </p>
              )}
            </div>

            {/* Relation */}
            <div className="space-y-2">
              <Label htmlFor={`parentContacts.${index}.relation`}>
                Hubungan <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`parentContacts.${index}.relation`}
                {...control.register(`parentContacts.${index}.relation`)}
                placeholder="Contoh: Ayah, Ibu, Wali"
                className={errors?.parentContacts?.[index]?.relation ? 'border-destructive' : ''}
              />
              {errors?.parentContacts?.[index]?.relation && (
                <p className="text-sm text-destructive">
                  {errors.parentContacts[index].relation.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor={`parentContacts.${index}.phone`}>
                No. Telepon <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`parentContacts.${index}.phone`}
                {...control.register(`parentContacts.${index}.phone`)}
                placeholder="Contoh: 08123456789"
                type="tel"
                className={errors?.parentContacts?.[index]?.phone ? 'border-destructive' : ''}
              />
              {errors?.parentContacts?.[index]?.phone && (
                <p className="text-sm text-destructive">
                  {errors.parentContacts[index].phone.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor={`parentContacts.${index}.email`}>Email</Label>
              <Input
                id={`parentContacts.${index}.email`}
                {...control.register(`parentContacts.${index}.email`)}
                placeholder="email@example.com"
                type="email"
                className={errors?.parentContacts?.[index]?.email ? 'border-destructive' : ''}
              />
              {errors?.parentContacts?.[index]?.email && (
                <p className="text-sm text-destructive">
                  {errors.parentContacts[index].email.message}
                </p>
              )}
            </div>
          </div>

          {/* Address - full width */}
          <div className="space-y-2">
            <Label htmlFor={`parentContacts.${index}.address`}>Alamat</Label>
            <Input
              id={`parentContacts.${index}.address`}
              {...control.register(`parentContacts.${index}.address`)}
              placeholder="Masukkan alamat lengkap"
              className={errors?.parentContacts?.[index]?.address ? 'border-destructive' : ''}
            />
            {errors?.parentContacts?.[index]?.address && (
              <p className="text-sm text-destructive">
                {errors.parentContacts[index].address.message}
              </p>
            )}
          </div>
        </div>
      ))}

      {errors?.parentContacts && typeof errors.parentContacts === 'object' && !Array.isArray(errors.parentContacts) && (
        <p className="text-sm text-destructive">
          {errors.parentContacts.message}
        </p>
      )}
    </div>
  );
}
