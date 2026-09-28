'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateStudentSchema, CreateStudentInput } from '@/lib/validations/student.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Gender } from '@prisma/client';
import { ParentContactFields } from './parent-contact-fields';
import { StudentPhotoUpload } from './student-photo-upload';
import { Loader2 } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  grade: number;
}

interface StudentFormProps {
  onSubmit: (data: CreateStudentInput) => void;
  classes: Class[];
  isSubmitting?: boolean;
  defaultValues?: Partial<CreateStudentInput>;
}

/**
 * StudentForm Component
 * Form for creating/editing student with validation
 */
export function StudentForm({
  onSubmit,
  classes,
  isSubmitting = false,
  defaultValues,
}: StudentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateStudentInput>({
    resolver: zodResolver(CreateStudentSchema),
    defaultValues: defaultValues || {
      parentContacts: [{ name: '', relation: '', phone: '', email: '', address: '' }],
    },
  });

  const studentName = watch('name') || 'Siswa';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Informasi Dasar</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* NIS */}
          <div className="space-y-2">
            <Label htmlFor="nis">
              NIS <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nis"
              {...register('nis')}
              placeholder="Nomor Induk Siswa"
              className={errors.nis ? 'border-destructive' : ''}
            />
            {errors.nis && (
              <p className="text-sm text-destructive">{errors.nis.message}</p>
            )}
          </div>

          {/* NISN */}
          <div className="space-y-2">
            <Label htmlFor="nisn">NISN</Label>
            <Input
              id="nisn"
              {...register('nisn')}
              placeholder="Nomor Induk Siswa Nasional"
            />
            {errors.nisn && (
              <p className="text-sm text-destructive">{errors.nisn.message}</p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">
              Nama Lengkap <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Nama lengkap siswa"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">
              Jenis Kelamin <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(value) => setValue('gender', value as Gender)}
              defaultValue={defaultValues?.gender}
            >
              <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Gender.LAKI_LAKI}>Laki-laki</SelectItem>
                <SelectItem value={Gender.PEREMPUAN}>Perempuan</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-sm text-destructive">{errors.gender.message}</p>
            )}
          </div>

          {/* Class */}
          <div className="space-y-2">
            <Label htmlFor="classId">
              Kelas <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(value) => setValue('classId', value)}
              defaultValue={defaultValues?.classId}
            >
              <SelectTrigger className={errors.classId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    Kelas {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.classId && (
              <p className="text-sm text-destructive">{errors.classId.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Personal Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Data Pribadi</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Birth Place */}
          <div className="space-y-2">
            <Label htmlFor="birthPlace">Tempat Lahir</Label>
            <Input
              id="birthPlace"
              {...register('birthPlace')}
              placeholder="Kota kelahiran"
            />
          </div>

          {/* Birth Date */}
          <div className="space-y-2">
            <Label htmlFor="birthDate">Tanggal Lahir</Label>
            <Input
              id="birthDate"
              type="date"
              {...register('birthDate')}
            />
          </div>

          {/* Religion */}
          <div className="space-y-2">
            <Label htmlFor="religion">Agama</Label>
            <Input
              id="religion"
              {...register('religion')}
              placeholder="Agama"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">No. Telepon</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="08123456789"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="Alamat lengkap"
            />
          </div>
        </div>
      </div>

      {/* Photo Upload Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Foto Siswa</h3>
        <StudentPhotoUpload
          currentPhoto={defaultValues?.photo}
          studentName={studentName}
          onPhotoChange={(file) => {
            // Handle file upload separately in the page component
            console.log('Photo selected:', file);
          }}
        />
      </div>

      {/* Parent Contacts Section */}
      <ParentContactFields control={control} errors={errors} />

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isSubmitting ? 'Menyimpan...' : 'Simpan Data Siswa'}
        </Button>
      </div>
    </form>
  );
}
