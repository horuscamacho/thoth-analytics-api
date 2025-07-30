import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username must not exceed 50 characters' })
  username!: string;

  @IsEnum(['DIRECTOR_COMUNICACION', 'LIDER', 'DIRECTOR_AREA', 'ASISTENTE'], {
    message: 'Role must be one of: DIRECTOR_COMUNICACION, LIDER, DIRECTOR_AREA, ASISTENTE',
  })
  @IsNotEmpty({ message: 'Role is required' })
  role!: 'DIRECTOR_COMUNICACION' | 'LIDER' | 'DIRECTOR_AREA' | 'ASISTENTE';
}
