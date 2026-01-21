import { SubmitHandler, useForm } from 'react-hook-form'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {z} from "zod"
import { Description } from '@radix-ui/react-dialog'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
	title:z.string().min(8),
	description:z.string(),
})

type FormFields = z.infer<typeof schema>;

export default function EventForm() {
	const { register, handleSubmit, formState: {errors, isSubmitting} } = useForm<FormFields>({
		resolver: zodResolver(schema),
	});

	const onSubmit:SubmitHandler<FormFields> = async (data) => {

		//could catch errors from backend here
		await new Promise((resolve) => setTimeout(resolve, 1000));
		console.log(data);
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<Input {...register('title', {
				required:'Title is required',
			})} placeholder="Title"/>
			{errors.title && <div className='text-red-500'>{errors.title.message}</div>}
			<Input {...register('description')} placeholder="description"/>
			<Button disabled={isSubmitting}>{isSubmitting? "Loading" : "Submit"}</Button>
		</form>
	)

}
